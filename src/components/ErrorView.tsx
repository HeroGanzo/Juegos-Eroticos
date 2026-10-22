"use client";

import Link from "next/link";
import { useEffect } from "react";

export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const dbMissing = error.digest === "DB_NOT_CONFIGURED";

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-lg">
        <p className="text-6xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-black text-white">{dbMissing ? "Base de datos no configurada" : "Algo salió mal"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {dbMissing
            ? "Falta la variable de entorno DATABASE_URL. Conecta una base de datos PostgreSQL (por ejemplo Neon desde la pestaña Storage de Vercel) y vuelve a desplegar."
            : "Se produjo un error al cargar esta página. Inténtalo de nuevo en unos segundos. Si el problema continúa, revisa que la base de datos esté disponible."}
        </p>
        {error.digest && !dbMissing && <p className="mt-2 text-xs text-zinc-600">Código: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Reintentar
          </button>
          <Link href="/" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
