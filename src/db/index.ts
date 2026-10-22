import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

/**
 * Variables de entorno aceptadas para la conexión (en orden de prioridad).
 * - DATABASE_URL: estándar (Neon desde el Marketplace de Vercel, Railway, Render...).
 * - POSTGRES_URL / POSTGRES_PRISMA_URL: integraciones de Supabase y Vercel Postgres.
 */
const URL_ENV_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

/** Error lanzado cuando no hay ninguna cadena de conexión configurada. */
export class DatabaseConfigError extends Error {
  readonly digest = "DB_NOT_CONFIGURED";
  constructor() {
    super("DATABASE_URL no está configurada: añade la cadena de conexión de PostgreSQL en las variables de entorno.");
    this.name = "DatabaseConfigError";
  }
}

function makeDb(pool: Pool) {
  return drizzle(pool);
}

export type Database = ReturnType<typeof makeDb>;

type Holder = { url?: string; pool?: Pool; db?: Database };
const globalForDb = globalThis as typeof globalThis & { __juegosEroticosDb?: Holder };
const holder: Holder = globalForDb.__juegosEroticosDb ?? (globalForDb.__juegosEroticosDb = {});

function readDatabaseUrl(): { envVar: string; url: string } | null {
  for (const name of URL_ENV_VARS) {
    const value = process.env[name]?.trim();
    if (value) return { envVar: name, url: value };
  }
  return null;
}

function isLocalHost(rawHost: string): boolean {
  const host = rawHost.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) return true; // socket Unix
  if (host === "localhost" || host === "::1" || host.startsWith("127.")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
  // Nombres de servicio sin dominio (Docker: "db", "postgres"...)
  return !host.includes(".") && !host.includes(":");
}

function resolveSsl(urlMode: string, local: boolean): PoolConfig["ssl"] {
  const mode = (process.env.DATABASE_SSL || urlMode || "").trim().toLowerCase();
  if (["disable", "false", "off", "0", "no"].includes(mode)) return false;
  if (["verify-full", "verify-ca", "verify", "strict"].includes(mode)) return { rejectUnauthorized: true };
  if (mode === "prefer" || mode === "allow" || mode === "") {
    // Las bases de datos en la nube (Neon, Supabase...) exigen SSL; las locales no.
    return local ? false : { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: false }; // require, no-verify, true...
}

export function buildPoolConfig(raw: string): { config: PoolConfig; host: string; isLocal: boolean } {
  const onVercel = Boolean(process.env.VERCEL);
  const base: PoolConfig = {
    max: Number(process.env.DB_POOL_MAX) || (onVercel ? 5 : 10),
    idleTimeoutMillis: onVercel ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  };
  try {
    const url = new URL(raw);
    const local = isLocalHost(url.hostname);
    const urlMode = url.searchParams.get("sslmode") ?? (url.searchParams.get("ssl") === "true" ? "require" : "");
    // Se quitan los parámetros SSL de la URL para que no anulen la configuración explícita.
    for (const key of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert", "sslpassword", "sslnegotiation", "channel_binding", "uselibpqcompat"]) {
      url.searchParams.delete(key);
    }
    return {
      config: { ...base, connectionString: url.toString(), ssl: resolveSsl(urlMode, local) },
      host: url.hostname,
      isLocal: local,
    };
  } catch {
    return { config: { ...base, connectionString: raw }, host: "", isLocal: false };
  }
}

function instance(): Database {
  const found = readDatabaseUrl();
  if (!found) throw new DatabaseConfigError();
  if (holder.db && holder.url === found.url) return holder.db;

  if (holder.pool) void holder.pool.end().catch(() => undefined);
  const pool = new Pool(buildPoolConfig(found.url).config);
  // Sin este manejador, una conexión inactiva cerrada por el servidor tumbaría el proceso.
  pool.on("error", (err) => {
    console.error("[db] Error en una conexión inactiva:", err.message);
  });
  // En Vercel libera las conexiones inactivas antes de suspender la función (no hace nada fuera de Vercel).
  attachDatabasePool(pool);

  holder.url = found.url;
  holder.pool = pool;
  holder.db = makeDb(pool);
  return holder.db;
}

export function getDb(): Database {
  return instance();
}

/**
 * Cliente de Drizzle con inicialización diferida: la conexión solo se crea la primera vez
 * que se usa. Así `next build` (por ejemplo en Vercel) funciona aunque no haya base de datos.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = instance();
    const value: unknown = Reflect.get(real, prop, real);
    if (typeof value === "function" && prop !== "constructor") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
  has(_target, prop) {
    return prop in instance();
  },
});

export type DatabaseInfo = { configured: boolean; envVar: string; isLocal: boolean; onVercel: boolean };

export function getDatabaseInfo(): DatabaseInfo {
  const onVercel = Boolean(process.env.VERCEL);
  const found = readDatabaseUrl();
  if (!found) return { configured: false, envVar: "", isLocal: false, onVercel };
  return { configured: true, envVar: found.envVar, isLocal: buildPoolConfig(found.url).isLocal, onVercel };
}
