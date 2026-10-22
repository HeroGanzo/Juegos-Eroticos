import { cache } from "react";
import { getDatabaseInfo } from "@/db";
import { ensureSeeded } from "./seed";

export type DbProblem = "missing" | "localhost" | "connection" | "auth" | "ssl" | "schema";

export type DbStatus =
  | { ok: true }
  | { ok: false; problem: DbProblem; code: string; envVar: string; onVercel: boolean };

const NETWORK_CODES = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"];
const AUTH_CODES = ["28P01", "28000", "3D000"];

/** Recorre la cadena `cause` (Drizzle envuelve los errores de `pg`) para obtener el código real. */
function rootCause(err: unknown): { code: string; message: string } {
  let current: unknown = err;
  for (let i = 0; i < 6 && current; i++) {
    const e = current as { code?: unknown; cause?: unknown; message?: unknown };
    if (typeof e.code === "string" && e.code) return { code: e.code, message: String(e.message ?? "") };
    if (!e.cause) break;
    current = e.cause;
  }
  const e = current as { name?: unknown; message?: unknown } | null;
  return { code: String(e?.name ?? "ERROR"), message: String(e?.message ?? "") };
}

/**
 * Comprueba (una vez por petición) que la base de datos está configurada, accesible
 * y con las tablas creadas. Nunca expone mensajes internos, solo un código.
 */
export const getDbStatus = cache(async (): Promise<DbStatus> => {
  const info = getDatabaseInfo();
  const base = { envVar: info.envVar, onVercel: info.onVercel };
  if (!info.configured) return { ok: false, problem: "missing", code: "NO_DATABASE_URL", ...base };
  try {
    await ensureSeeded();
    return { ok: true };
  } catch (err) {
    const { code, message } = rootCause(err);
    console.error(`[db] Base de datos no disponible (${code}):`, message);
    let problem: DbProblem = "schema";
    if (NETWORK_CODES.includes(code) || /timeout|terminated|connect/i.test(message)) {
      problem = info.isLocal && info.onVercel ? "localhost" : "connection";
    } else if (AUTH_CODES.includes(code)) {
      problem = "auth";
    } else if (/ssl|tls|cert/i.test(`${code} ${message}`)) {
      problem = "ssl";
    }
    return { ok: false, problem, code, ...base };
  }
});
