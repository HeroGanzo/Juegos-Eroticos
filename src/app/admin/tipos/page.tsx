import { sql } from "drizzle-orm";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { deletePostTypeForm, savePostTypeForm } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/AdminUi";
import { ConfirmButton, SubmitButton } from "@/components/ui/Buttons";
import { db } from "@/db";
import { postTypes } from "@/db/schema";
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export default async function AdminPostTypesPage() {
  const types = await db
    .select({
      id: postTypes.id,
      name: postTypes.name,
      slug: postTypes.slug,
      icon: postTypes.icon,
      description: postTypes.description,
      sortOrder: postTypes.sortOrder,
      count: sql<number>`(select count(*)::int from posts p where p.post_type_id = ${postTypes.id})`,
    })
    .from(postTypes)
    .orderBy(postTypes.sortOrder, postTypes.name);

  return (
    <div className="space-y-8">
      <AdminTitle
        title="Tipos de publicación"
        subtitle="Agrega o quita los tipos de publicación disponibles (juego, mod, traducción, guía, noticia...). Los visitantes pueden filtrar por tipo."
      />

      <form action={savePostTypeForm} className={cn(cardCls, "grid items-end gap-3 p-5 md:grid-cols-[90px_1fr_1.4fr_90px_auto]")}>
        <h2 className="text-sm font-black uppercase tracking-wider text-white md:col-span-5">Nuevo tipo de publicación</h2>
        <div>
          <label className={labelCls}>Icono</label>
          <input name="icon" defaultValue="🎮" maxLength={8} className={cn(inputCls, "text-center text-lg")} />
        </div>
        <div>
          <label className={labelCls}>Nombre</label>
          <input name="name" required placeholder="Ej: Demo" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <input name="description" placeholder="Opcional" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Orden</label>
          <input type="number" name="sortOrder" defaultValue={types.length} className={inputCls} />
        </div>
        <SubmitButton className={btnPrimary} pendingText="Añadiendo...">
          <FaPlus /> Añadir
        </SubmitButton>
      </form>

      <div className="space-y-3">
        {types.map((t) => (
          <div key={t.id} className={cn(cardCls, "p-4")}>
            <form action={savePostTypeForm} className="grid items-end gap-3 md:grid-cols-[80px_1fr_1fr_1.4fr_80px_auto]">
              <input type="hidden" name="id" value={t.id} />
              <div>
                <label className={labelCls}>Icono</label>
                <input name="icon" defaultValue={t.icon} maxLength={8} className={cn(inputCls, "text-center text-lg")} />
              </div>
              <div>
                <label className={labelCls}>Nombre</label>
                <input name="name" defaultValue={t.name} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input name="slug" defaultValue={t.slug} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descripción</label>
                <input name="description" defaultValue={t.description} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Orden</label>
                <input type="number" name="sortOrder" defaultValue={t.sortOrder} className={inputCls} />
              </div>
              <SubmitButton className={btnSecondary}>
                <FaSave /> Guardar
              </SubmitButton>
            </form>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>{t.count} publicaciones · /juegos?tipo={t.slug}</span>
              <form action={deletePostTypeForm}>
                <input type="hidden" name="id" value={t.id} />
                <ConfirmButton
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-red-300 hover:bg-red-500/10"
                  message={`¿Eliminar el tipo "${t.name}"? Las publicaciones quedarán sin tipo.`}
                >
                  <FaTrash /> Eliminar
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
