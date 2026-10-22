import { getDbStatus } from "@/lib/db-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getDbStatus();
  if (!status.ok) {
    return Response.json({ ok: false, problem: status.problem, code: status.code }, { status: 503 });
  }
  return Response.json({ ok: true });
}
