import { db } from "@/db";
import { media } from "@/db/schema";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 150 * 1024 * 1024;

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Solicitud no válida" }, { status: 400 });
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
  if (isImage && file.size > MAX_IMAGE) {
    return Response.json({ error: "La imagen supera el máximo de 15 MB" }, { status: 400 });
  }
  if (isVideo && file.size > MAX_VIDEO) {
    return Response.json({ error: "El video supera el máximo de 150 MB" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({ filename: file.name.slice(0, 200), mimeType: type, size: buffer.length, data: buffer })
    .returning({ id: media.id });
  return Response.json({ url: `/api/media/${row.id}`, id: row.id, type });
}
