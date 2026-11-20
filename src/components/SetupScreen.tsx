import Link from "next/link";
import type { DbProblem, DbStatus } from "@/lib/db-status";

type Failed = Extract<DbStatus, { ok: false }>;

const PROBLEMS: Record<DbProblem, { title: string; text: string }> = {
  missing: {
    title: "Falta conectar la base de datos",
    text: "El sitio se desplegó correctamente, pero todavía no tiene una base de datos PostgreSQL configurada (variable de entorno DATABASE_URL).",
  },
  localhost: {
    title: "La base de datos apunta a localhost",
    text: "La variable DATABASE_URL apunta a localhost / 127.0.0.1. Esa dirección solo existe en tu ordenador o en la vista previa: en Vercel necesitas una base de datos en la nube (Neon, Supabase...).",
  },
  connection: {
    title: "No se puede conectar con la base de datos",
    text: "La variable DATABASE_URL está configurada, pero el servidor de base de datos no responde. Revisa que la dirección sea correcta y que la base de datos esté activa.",
  },
  auth: {
    title: "Usuario, contraseña o base de datos incorrectos",
    text: "El servidor rechazó la conexión. Revisa el usuario, la contraseña y el nombre de la base en DATABASE_URL.",
  },
  ssl: {
    title: "Error de conexión segura (SSL)",
    text: "No se pudo establecer la conexión SSL. Revisa DATABASE_SSL y el certificado de tu proveedor.",
  },
  admin: {
    title: "Falta definir la contraseña inicial",
    text: "Para inicializar una base nueva en el VPS, configura ADMIN_PASSWORD con una contraseña aleatoria de al menos 16 caracteres y reinicia el servicio.",
  },
  schema: {
    title: "No se pudieron preparar las tablas",
    text: "La conexión funciona, pero falló la creación automática de las tablas. Revisa los registros (Logs) del despliegue para ver el detalle.",
  },
};

export function SetupScreen({ status }: { status: Failed }) {
  const info = PROBLEMS[status.problem];
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-400/40 bg-zinc-950/90 p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Configuración pendiente</p>
        <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">{info.title}</h1>
        <p className="mt-4 leading-relaxed text-zinc-300">{info.text}</p>

        <h2 className="mt-8 text-sm font-black uppercase tracking-wider text-white">Cómo solucionarlo{status.onVercel ? " en Vercel" : " en el VPS"}</h2>
        {status.onVercel ? (
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300 marker:font-bold marker:text-amber-300">
            <li>
              Abre tu proyecto en Vercel → pestaña <b className="text-white">Storage</b> → <b className="text-white">Create Database</b> →
              elige <b className="text-white">Neon</b> (Postgres), región <b className="text-white">Washington, D.C. (US East)</b> →{" "}
              <b className="text-white">Connect</b>. La variable <code className="rounded bg-white/10 px-1.5">DATABASE_URL</code> se crea sola.
            </li>
            <li>
              ¿Usas otro proveedor (Supabase, Railway...)? Ve a <b className="text-white">Settings → Environment Variables</b> y crea{" "}
              <code className="rounded bg-white/10 px-1.5">DATABASE_URL</code> con la cadena de conexión.
            </li>
            <li>
              Recomendado: crea también <code className="rounded bg-white/10 px-1.5">ADMIN_PASSWORD</code> con la contraseña que quieras para el
              administrador.
            </li>
            <li>
              Ve a <b className="text-white">Deployments</b> → menú <b className="text-white">⋯</b> del último despliegue →{" "}
              <b className="text-white">Redeploy</b>. En la primera visita se crean solas las tablas y el contenido de ejemplo.
            </li>
          </ol>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            Revisa la configuración de PostgreSQL y las variables del servicio. Si cambias el archivo de entorno,
            reinicia la aplicación. Consulta la guía de Hostinger en el README del repositorio.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="text-xs text-zinc-500">
            Detalle técnico: <code>{status.code}</code>
            {status.envVar ? (
              <>
                {" "}
                · variable usada: <code>{status.envVar}</code>
              </>
            ) : null}
          </p>
          <Link href="/" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:brightness-110">
            Reintentar
          </Link>
        </div>
      </div>
    </main>
  );
}
