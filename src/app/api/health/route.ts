import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getDbStatus } from "@/lib/db-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getDbStatus();
  if (!status.ok) {
    return Response.json({ ok: false, problem: status.problem, code: status.code }, { status: 503 });
  }
  // El arranque inicial queda en memoria; verifica la conexión en cada sondeo.
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, problem: "connection", code: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
