import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num)) return new Response("Not found", { status: 404 });
  const rows = await db.select().from(media).where(eq(media.id, num)).limit(1);
  const row = rows[0];
  if (!row) return new Response("Not found", { status: 404 });

  const data = new Uint8Array(row.data);
  const total = data.byteLength;
  const headers: Record<string, string> = {
    "Content-Type": row.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };
  if (row.mimeType.includes("svg")) {
    headers["Content-Security-Policy"] = "script-src 'none'; sandbox";
  }

  const range = req.headers.get("range");
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      let start = m[1] ? Number.parseInt(m[1], 10) : Number.NaN;
      let end = m[2] ? Number.parseInt(m[2], 10) : Number.NaN;
      if (Number.isNaN(start)) {
        start = Math.max(0, total - (Number.isNaN(end) ? 0 : end));
        end = total - 1;
      }
      if (Number.isNaN(end) || end >= total) end = total - 1;
      if (start >= 0 && start <= end) {
        return new Response(data.slice(start, end + 1), {
          status: 206,
          headers: {
            ...headers,
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Content-Length": String(end - start + 1),
          },
        });
      }
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    }
  }
  return new Response(data, { headers: { ...headers, "Content-Length": String(total) } });
}
