export type UploadLimits = {
  /** "blob": subida directa a Vercel Blob (archivos grandes). "db": se guardan en PostgreSQL. */
  mode: "blob" | "db";
  maxImage: number;
  maxVideo: number;
  vercel: boolean;
};

const MB = 1024 * 1024;

/** Límite del cuerpo de las peticiones en las funciones de Vercel (4,5 MB) con margen. */
export const VERCEL_BODY_LIMIT = 4 * MB;

export function getUploadLimits(): UploadLimits {
  const vercel = Boolean(process.env.VERCEL);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { mode: "blob", maxImage: 25 * MB, maxVideo: 500 * MB, vercel };
  }
  if (vercel) return { mode: "db", maxImage: VERCEL_BODY_LIMIT, maxVideo: VERCEL_BODY_LIMIT, vercel };
  return { mode: "db", maxImage: 15 * MB, maxVideo: 150 * MB, vercel };
}
