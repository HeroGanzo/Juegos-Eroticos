import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { deleteCategoryForm, saveCategoryForm } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/AdminUi";
import { ConfirmButton, SubmitButton } from "@/components/ui/Buttons";
import { getCategoriesWithCounts } from "@/lib/posts";
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

const colorCls = "h-[42px] w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 p-1";

export default async function AdminCategoriesPage() {
  const cats = await getCategoriesWithCounts();
  return (
    <div className="space-y-8">
      <AdminTitle
        title="Categorías"
        subtitle="Las categorías organizan los juegos por género. Cada publicación puede tener varias y los visitantes pueden buscar y filtrar por ellas."
      />

      <form action={saveCategoryForm} className={cn(cardCls, "grid items-end gap-3 p-5 md:grid-cols-[1fr_1.4fr_90px_90px_auto]")}>
        <h2 className="text-sm font-black uppercase tracking-wider text-white md:col-span-5">Nueva categoría</h2>
        <div>
          <label className={labelCls}>Nombre</label>
          <input name="name" required placeholder="Ej: Visual Novel" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <input name="description" placeholder="Opcional" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Color</label>
          <input type="color" name="color" defaultValue="#ec4899" className={colorCls} />
        </div>
        <div>
          <label className={labelCls}>Orden</label>
          <input type="number" name="sortOrder" defaultValue={cats.length} className={inputCls} />
        </div>
        <SubmitButton className={btnPrimary} pendingText="Añadiendo...">
          <FaPlus /> Añadir
        </SubmitButton>
      </form>

      <div className="space-y-3">
        {cats.map((c) => (
          <div key={c.id} className={cn(cardCls, "p-4")}>
            <form action={saveCategoryForm} className="grid items-end gap-3 md:grid-cols-[1fr_1fr_1.4fr_80px_80px_auto]">
              <input type="hidden" name="id" value={c.id} />
              <div>
                <label className={labelCls}>Nombre</label>
                <input name="name" defaultValue={c.name} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Slug (URL)</label>
                <input name="slug" defaultValue={c.slug} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descripción</label>
                <input name="description" defaultValue={c.description} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <input type="color" name="color" defaultValue={c.color} className={colorCls} />
              </div>
              <div>
                <label className={labelCls}>Orden</label>
                <input type="number" name="sortOrder" defaultValue={c.sortOrder} className={inputCls} />
              </div>
              <SubmitButton className={btnSecondary}>
                <FaSave /> Guardar
              </SubmitButton>
            </form>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.totalCount} en total ({c.count} publicadas{c.draftCount ? `, ${c.draftCount} borradores` : ""}) · /juegos?cat={c.slug}
              </span>
              <form action={deleteCategoryForm}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-red-300 hover:bg-red-500/10"
                  message={`¿Eliminar la categoría "${c.name}"? Las publicaciones no se borrarán.`}
                >
                  <FaTrash /> Eliminar
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
        {!cats.length && <p className="text-center text-zinc-400">Aún no hay categorías.</p>}
      </div>
    </div>
  );
}
