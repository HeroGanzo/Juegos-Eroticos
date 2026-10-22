import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
  let seeded = true;
  try {
    await ensureSeeded();
  } catch (err) {
    seeded = false;
    console.error("[health] seed failed", err);
  }
  return Response.json({ ok: true, seeded });
}
