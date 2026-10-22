import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getViewer } from "@/lib/auth";
import { getUploadLimits } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * Genera los permisos para que el navegador del administrador suba archivos
 * directamente a Vercel Blob (sin el límite de 4,5 MB de las funciones).
 * Requiere la variable BLOB_READ_WRITE_TOKEN (se crea al conectar un Blob store).
 */
export async function POST(request: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Vercel Blob no está configurado (falta BLOB_READ_WRITE_TOKEN)" }, { status: 400 });
  }
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Solicitud no válida" }, { status: 400 });
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const viewer = await getViewer();
        if (!viewer.isAdmin) throw new Error("No autorizado");
        return {
          allowedContentTypes: ["image/*", "video/*"],
          maximumSizeInBytes: getUploadLimits().maxVideo,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al preparar la subida";
    return Response.json({ error: message }, { status: message === "No autorizado" ? 401 : 400 });
  }
}
