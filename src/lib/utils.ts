export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

export function getVideoEmbed(url: string): { kind: "iframe" | "video" | "none"; src: string } {
  const u = (url ?? "").trim();
  if (!u) return { kind: "none", src: "" };
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(u) || u.startsWith("/api/media/")) {
    return { kind: "video", src: u };
  }
  return { kind: "iframe", src: u };
}

export function str(v: FormDataEntryValue | null | undefined, max = 5000): string {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

export function int(v: FormDataEntryValue | null | undefined, fallback = 0): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}
