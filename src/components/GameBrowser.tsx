import Link from "next/link";
import { FaChevronLeft, FaChevronRight, FaSearch, FaTimes } from "react-icons/fa";
import type { PageFilters } from "@/db/schema";
import { canAccess, type Viewer } from "@/lib/auth";
import { ACCESS_INFO, ACCESS_LEVELS, PLATFORMS, SORT_OPTIONS } from "@/lib/constants";
import { searchPosts } from "@/lib/posts";
import { btnPrimary, inputCls } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";

export type BrowserParams = Record<string, string | undefined>;

export function pickParams(sp: Record<string, string | string[] | undefined>): BrowserParams {
  const out: BrowserParams = {};
  for (const [k, v] of Object.entries(sp)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

export async function GameBrowser({
  basePath,
  params,
  fixed = {},
  viewer,
  perPage,
  categories,
  postTypes,
}: {
  basePath: string;
  params: BrowserParams;
  fixed?: PageFilters;
  viewer: Viewer;
  perPage: number;
  categories: { slug: string; name: string }[];
  postTypes: { slug: string; name: string; icon: string }[];
}) {
  const q = (params.q ?? "").trim();
  const cat = fixed.category ? "" : (params.cat ?? "");
  const plat = fixed.platform ? "" : (params.plat ?? "");
  const tipo = fixed.postType ? "" : (params.tipo ?? "");
  const acceso = fixed.access ? "" : (params.acceso ?? "");
  const orden = params.orden ?? "";
  const page = Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1);

  const result = await searchPosts({
    q,
    category: fixed.category || cat,
    platform: fixed.platform || plat,
    postType: fixed.postType || tipo,
    access: fixed.access || acceso,
    sort: orden || fixed.sort || "recientes",
    page,
    perPage,
  });

  const current: Record<string, string> = { q, cat, plat, tipo, acceso, orden };
  const hrefWith = (overrides: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...current, ...overrides })) {
      if (v !== "" && v !== undefined && !(k === "pagina" && Number(v) === 1)) sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const hasFilters = Boolean(q || cat || plat || tipo || acceso || orden);
  const catName = categories.find((c) => c.slug === (fixed.category || cat))?.name;

  return (
    <div>
      <form action={basePath} method="get" className="rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
            <input name="q" defaultValue={q} placeholder="Buscar por nombre o categoría..." className={cn(inputCls, "pl-10")} />
          </div>
          {!fixed.category && (
            <select name="cat" defaultValue={cat} className={inputCls} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {!fixed.platform && (
            <select name="plat" defaultValue={plat} className={inputCls} aria-label="Plataforma">
              <option value="">Todas las plataformas</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
          {!fixed.postType && (
            <select name="tipo" defaultValue={tipo} className={inputCls} aria-label="Tipo">
              <option value="">Todos los tipos</option>
              {postTypes.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          )}
          {!fixed.access && (
            <select name="acceso" defaultValue={acceso} className={inputCls} aria-label="Acceso">
              <option value="">Todo el contenido</option>
              {ACCESS_LEVELS.map((a) => (
                <option key={a} value={a}>
                  {ACCESS_INFO[a].short}
                </option>
              ))}
            </select>
          )}
          <select name="orden" defaultValue={orden} className={inputCls} aria-label="Orden">
            <option value="">Ordenar: por defecto</option>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="submit" className={cn(btnPrimary, "lg:col-span-1")}>
            <FaSearch /> Buscar
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
        <p>
          <span className="font-bold text-white">{result.total}</span> {result.total === 1 ? "resultado" : "resultados"}
          {q && (
            <>
              {" "}
              para «<span className="text-white">{q}</span>»
            </>
          )}
          {catName && (
            <>
              {" "}
              en <span className="text-white">{catName}</span>
            </>
          )}
        </p>
        {hasFilters && (
          <Link href={basePath} className="inline-flex items-center gap-1.5 text-brand hover:underline">
            <FaTimes /> Limpiar filtros
          </Link>
        )}
      </div>

      {result.items.length ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.items.map((p) => (
            <PostCard key={p.id} post={p} locked={!canAccess(viewer, p.accessLevel)} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 font-semibold text-white">No se encontraron juegos</p>
          <p className="mt-1 text-sm text-zinc-400">Prueba con otro nombre, categoría o plataforma.</p>
        </div>
      )}

      {result.pages > 1 && (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación">
          {result.page > 1 && (
            <Link href={hrefWith({ pagina: result.page - 1 })} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
              <FaChevronLeft />
            </Link>
          )}
          {Array.from({ length: result.pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === result.pages || Math.abs(n - result.page) <= 2)
            .map((n, idx, arr) => (
              <span key={n} className="flex items-center gap-2">
                {idx > 0 && n - arr[idx - 1] > 1 && <span className="text-zinc-500">…</span>}
                <Link
                  href={hrefWith({ pagina: n })}
                  className={cn(
                    "grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm font-semibold",
                    n === result.page ? "border-brand bg-brand text-white" : "border-white/10 bg-white/5 hover:bg-white/10",
                  )}
                >
                  {n}
                </Link>
              </span>
            ))}
          {result.page < result.pages && (
            <Link href={hrefWith({ pagina: result.page + 1 })} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
              <FaChevronRight />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
