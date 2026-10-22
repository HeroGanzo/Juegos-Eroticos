import Link from "next/link";
import { FaEdit, FaEye, FaPlus, FaSearch, FaStar, FaTrash } from "react-icons/fa";
import { deletePostForm, togglePostFieldForm } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/AdminUi";
import { AccessBadge, PlatformIcon } from "@/components/Bits";
import { pickParams } from "@/components/GameBrowser";
import { ConfirmButton } from "@/components/ui/Buttons";
import { ACCESS_INFO, ACCESS_LEVELS } from "@/lib/constants";
import { searchPosts } from "@/lib/posts";
import { btnPrimary, btnSecondary, cardCls, inputCls } from "@/lib/ui";
import { cn, formatDate, formatNumber } from "@/lib/utils";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = pickParams(await searchParams);
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);
  const result = await searchPosts({
    q: sp.q,
    access: sp.acceso,
    status: sp.estado,
    includeDrafts: true,
    perPage: 25,
    page,
    sort: sp.orden || "recientes",
  });
  const qs = (n: number) => {
    const p = new URLSearchParams();
    for (const k of ["q", "acceso", "estado", "orden"]) if (sp[k]) p.set(k, String(sp[k]));
    if (n > 1) p.set("pagina", String(n));
    const s = p.toString();
    return s ? `/admin/publicaciones?${s}` : "/admin/publicaciones";
  };

  return (
    <div>
      <AdminTitle
        title="Publicaciones"
        subtitle="Juegos, mods, traducciones, guías y noticias. Elige para cada una el tipo de acceso: público, registrados o VIP."
        actions={
          <Link href="/admin/publicaciones/nueva" className={btnPrimary}>
            <FaPlus /> Nueva publicación
          </Link>
        }
      />

      <form className={cn(cardCls, "mb-6 grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_auto]")}>
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por título o categoría..." className={inputCls} />
        <select name="acceso" defaultValue={sp.acceso ?? ""} className={inputCls}>
          <option value="">Todos los accesos</option>
          {ACCESS_LEVELS.map((a) => (
            <option key={a} value={a}>
              {ACCESS_INFO[a].short}
            </option>
          ))}
        </select>
        <select name="estado" defaultValue={sp.estado ?? ""} className={inputCls}>
          <option value="">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
        <button type="submit" className={btnSecondary}>
          <FaSearch /> Filtrar
        </button>
      </form>

      <p className="mb-3 text-sm text-zinc-400">{result.total} publicaciones</p>

      <div className={cn(cardCls, "overflow-x-auto")}>
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="p-3">Publicación</th>
              <th className="p-3">Acceso</th>
              <th className="p-3">Plataformas</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Vistas</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {result.items.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-14 w-11 shrink-0 place-items-center rounded-lg bg-zinc-800">🎮</div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/admin/publicaciones/${p.id}`} className="line-clamp-1 font-semibold text-white hover:text-brand">
                        {p.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                        {p.postType ? `${p.postType.icon} ${p.postType.name} · ` : ""}
                        {p.categories.map((c) => c.name).join(", ") || "Sin categoría"} · {formatDate(p.createdAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <AccessBadge level={p.accessLevel} />
                </td>
                <td className="p-3">
                  <div className="flex gap-1.5 text-zinc-300">
                    {p.platforms.map((pl) => (
                      <PlatformIcon key={pl} platform={pl} />
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <form action={togglePostFieldForm}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="status" />
                      <button
                        type="submit"
                        title="Cambiar estado"
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold",
                          p.status === "published" ? "bg-emerald-500/20 text-emerald-200" : "bg-zinc-700 text-zinc-200",
                        )}
                      >
                        {p.status === "published" ? "Publicado" : "Borrador"}
                      </button>
                    </form>
                    <form action={togglePostFieldForm}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="featured" />
                      <button type="submit" title={p.featured ? "Quitar de destacados" : "Destacar"} className={p.featured ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}>
                        <FaStar />
                      </button>
                    </form>
                  </div>
                </td>
                <td className="p-3 text-zinc-300">{formatNumber(p.views)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/juego/${p.slug}`} target="_blank" className="rounded-lg bg-white/5 p-2 text-zinc-300 hover:bg-white/10" title="Ver">
                      <FaEye />
                    </Link>
                    <Link href={`/admin/publicaciones/${p.id}`} className="rounded-lg bg-white/5 p-2 text-zinc-300 hover:bg-white/10" title="Editar">
                      <FaEdit />
                    </Link>
                    <form action={deletePostForm}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20" message={`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`}>
                        <FaTrash />
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!result.items.length && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-zinc-400">
                  No hay publicaciones con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result.pages > 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={qs(n)}
              className={cn("grid h-9 min-w-9 place-items-center rounded-lg border px-3 text-sm", n === result.page ? "border-brand bg-brand text-white" : "border-white/10 bg-white/5")}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
