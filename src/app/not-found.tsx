import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-20 text-center">
      <div>
        <p className="text-8xl font-black text-brand">404</p>
        <h1 className="mt-4 text-3xl font-black text-white">Página no encontrada</h1>
        <p className="mt-3 text-zinc-400">El contenido que buscas no existe o ha sido eliminado.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:brightness-110">
            Volver al inicio
          </Link>
          <Link href="/juegos" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Buscar juegos
          </Link>
        </div>
      </div>
    </div>
  );
}
