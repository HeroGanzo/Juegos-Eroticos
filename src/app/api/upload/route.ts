import { db } from "@/db";
import { media } from "@/db/schema";
import { getViewer } from "@/lib/auth";
import { getUploadLimits, VERCEL_BODY_LIMIT } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MB = 1024 * 1024;

/** Devuelve el modo y los límites de subida (para el panel de control). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) return Response.json({ error: "No autorizado" }, { status: 401 });
  return Response.json(getUploadLimits());
}

/** Guarda la imagen o el video en PostgreSQL (modo sin Vercel Blob). */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Solicitud no válida o archivo demasiado grande" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }
  const type = file.type || "application/octet-stream";
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  if (!isImage && !isVideo) {
    return Response.json({ error: "Solo se permiten imágenes o videos" }, { status: 400 });
  }
  const max = process.env.VERCEL ? VERCEL_BODY_LIMIT : isVideo ? 150 * MB : 15 * MB;
  if (file.size > max) {
    return Response.json(
      { error: `El archivo supera el máximo de ${Math.round(max / MB)} MB${isVideo ? ". Usa un enlace de YouTube/Vimeo o activa Vercel Blob" : ""}` },
      { status: 413 },
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({ filename: file.name.slice(0, 200), mimeType: type, size: buffer.length, data: buffer })
    .returning({ id: media.id });
  return Response.json({ url: `/api/media/${row.id}`, id: row.id, type });
}
