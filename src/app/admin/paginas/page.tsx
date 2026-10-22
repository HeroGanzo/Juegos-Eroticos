import Link from "next/link";
import { asc } from "drizzle-orm";
import { FaEdit, FaExternalLinkAlt, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { deletePageForm, updatePageMenuForm } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/AdminUi";
import { AccessBadge } from "@/components/Bits";
import { ConfirmButton, SubmitButton } from "@/components/ui/Buttons";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { MENU_SECTIONS, PAGE_TYPES, pageHref } from "@/lib/constants";
import { btnPrimary, btnSmall, cardCls, inputCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export default async function AdminPagesPage() {
  const list = await db.select().from(pages).orderBy(asc(pages.menuOrder), asc(pages.id));
  const typeLabel = (t: string) => PAGE_TYPES.find((p) => p.value === t)?.label ?? t;
  const header = list.filter((p) => p.published && (p.menuSection === "header" || p.menuSection === "both"));
  const footer = list.filter((p) => p.published && (p.menuSection === "footer" || p.menuSection === "both"));

  return (
    <div className="space-y-8">
      <AdminTitle
        title="Páginas y menú"
        subtitle="Crea páginas de distintos tipos (contenido, listas de juegos, categorías, sobre mí, contacto, VIP o enlaces), elige su público y en qué sección del menú aparecen."
        actions={
          <Link href="/admin/paginas/nueva" className={btnPrimary}>
            <FaPlus /> Nueva página
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn(cardCls, "p-5")}>
          <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-zinc-400">Vista previa · Menú principal</h2>
          <div className="flex flex-wrap gap-2">
            {header.map((p) => (
              <span key={p.id} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {p.title}
              </span>
            ))}
            {!header.length && <span className="text-sm text-zinc-500">Vacío</span>}
          </div>
        </div>
        <div className={cn(cardCls, "p-5")}>
          <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-zinc-400">Vista previa · Pie de página</h2>
          <div className="flex flex-wrap gap-2">
            {footer.map((p) => (
              <span key={p.id} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {p.title}
              </span>
            ))}
            {!footer.length && <span className="text-sm text-zinc-500">Vacío</span>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((p) => (
          <div key={p.id} className={cn(cardCls, "flex flex-col gap-4 p-4 lg:flex-row lg:items-center")}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/paginas/${p.id}`} className="font-bold text-white hover:text-brand">
                  {p.title}
                </Link>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">{typeLabel(p.type)}</span>
                {p.type !== "link" && <AccessBadge level={p.accessLevel} />}
                {!p.published && <span className="rounded-md bg-zinc-700 px-2 py-0.5 text-[11px] font-bold text-zinc-200">Oculta</span>}
              </div>
              <p className="mt-1 truncate text-xs text-zinc-500">{pageHref(p)}</p>
            </div>
            <form action={updatePageMenuForm} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <select name="menuSection" defaultValue={p.menuSection} className={cn(inputCls, "w-auto py-2 text-xs")} aria-label="Sección del menú">
                {MENU_SECTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input type="number" name="menuOrder" defaultValue={p.menuOrder} className={cn(inputCls, "w-20 py-2 text-xs")} aria-label="Orden" title="Orden" />
              <label className="flex items-center gap-1.5 text-xs text-zinc-300">
                <input type="checkbox" name="published" defaultChecked={p.published} className="accent-brand" /> Visible
              </label>
              <SubmitButton className={btnSmall} pendingText="...">
                <FaSave /> Guardar
              </SubmitButton>
            </form>
            <div className="flex gap-1.5">
              <Link href={pageHref(p)} target="_blank" className="rounded-lg bg-white/5 p-2 text-zinc-300 hover:bg-white/10" title="Ver">
                <FaExternalLinkAlt />
              </Link>
              <Link href={`/admin/paginas/${p.id}`} className="rounded-lg bg-white/5 p-2 text-zinc-300 hover:bg-white/10" title="Editar">
                <FaEdit />
              </Link>
              <form action={deletePageForm}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20" message={`¿Eliminar la página "${p.title}"?`}>
                  <FaTrash />
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
        {!list.length && <p className="text-center text-zinc-400">No hay páginas. Crea la primera.</p>}
      </div>
    </div>
  );
}
