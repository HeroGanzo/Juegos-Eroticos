import type { UploadLimits } from "./uploads";
import { slugify } from "./utils";

const MB = 1024 * 1024;
const FALLBACK_LIMITS: UploadLimits = { mode: "db", maxImage: 4 * MB, maxVideo: 4 * MB, vercel: true };

let limitsPromise: Promise<UploadLimits> | null = null;

function getLimits(): Promise<UploadLimits> {
  if (!limitsPromise) {
    limitsPromise = fetch("/api/upload", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as UploadLimits;
      })
      .catch(() => {
        limitsPromise = null;
        return FALLBACK_LIMITS;
      });
  }
  return limitsPromise;
}

export function formatBytes(n: number): string {
  if (n >= MB) return `${(n / MB).toFixed(n >= 10 * MB ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

function safeFileName(name: string, fallbackExt: string): string {
  const dot = name.lastIndexOf(".");
  const base = slugify(dot > 0 ? name.slice(0, dot) : name) || "archivo";
  const ext = (dot > 0 ? name.slice(dot + 1) : fallbackExt).toLowerCase().replace(/[^a-z0-9]/g, "") || fallbackExt;
  return `${base}.${ext}`;
}

const OPTIMIZABLE = /^image\/(jpeg|pjpeg|png|webp|bmp|avif)$/i;

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decodeImage(file: File): Promise<Decoded | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      /* se intenta con <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  const webp = await canvasToBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") return webp;
  // Safari no codifica WebP: se aplana sobre fondo blanco y se usa JPEG.
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);
  return canvasToBlob(flat, "image/jpeg", quality);
}

/** Reduce automáticamente las fotos grandes (más de 1,5 MB) antes de subirlas. */
export async function optimizeImage(file: File, maxBytes: number): Promise<File> {
  if (!OPTIMIZABLE.test(file.type) || file.size <= Math.min(maxBytes, 1.5 * MB)) return file;
  const decoded = await decodeImage(file);
  if (!decoded || !decoded.width || !decoded.height) return file;
  const target = Math.min(maxBytes * 0.9, 3 * MB);
  let best: Blob | null = null;
  try {
    const steps = [
      [2400, 0.86],
      [1920, 0.8],
      [1600, 0.74],
      [1280, 0.68],
      [1024, 0.62],
    ] as const;
    for (const [maxSide, quality] of steps) {
      const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(decoded.width * scale));
      canvas.height = Math.max(1, Math.round(decoded.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      const blob = await encode(canvas, quality);
      if (blob && (!best || blob.size < best.size)) best = blob;
      if (best && best.size <= target) break;
    }
  } finally {
    decoded.release();
  }
  if (!best || best.size >= file.size) return file;
  const ext = best.type === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([best], `${base}.${ext}`, { type: best.type, lastModified: Date.now() });
}

/**
 * Sube una imagen o un video y devuelve su URL pública.
 * - Con Vercel Blob configurado: subida directa desde el navegador (archivos grandes).
 * - Sin Blob: se guarda en PostgreSQL (en Vercel, máx. 4 MB por archivo).
 */
export async function uploadFile(file: File): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) throw new Error("Solo se permiten imágenes o videos.");

  const limits = await getLimits();
  const toSend = isImage ? await optimizeImage(file, limits.maxImage) : file;
  const max = isVideo ? limits.maxVideo : limits.maxImage;
  if (toSend.size > max) {
    if (isVideo && limits.mode === "db" && limits.vercel) {
      throw new Error(
        `El video pesa ${formatBytes(toSend.size)} y en Vercel el límite es ${formatBytes(max)}. Súbelo a YouTube o Vimeo y pega el enlace, o activa Vercel Blob (ver DEPLOY_VERCEL.md).`,
      );
    }
    throw new Error(`El archivo pesa ${formatBytes(toSend.size)} y el máximo permitido es ${formatBytes(max)}.`);
  }

  if (limits.mode === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const result = await upload(`juegos/${safeFileName(toSend.name, isVideo ? "mp4" : "jpg")}`, toSend, {
      access: "public",
      handleUploadUrl: "/api/upload/blob",
      contentType: toSend.type || undefined,
      multipart: toSend.size > 25 * MB,
    });
    return result.url;
  }

  const fd = new FormData();
  fd.append("file", toSend);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (res.status === 413) {
    throw new Error(`El archivo es demasiado grande para el servidor (máximo ${formatBytes(max)}).`);
  }
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error || `Error al subir el archivo (código ${res.status}).`);
  return json.url;
}
