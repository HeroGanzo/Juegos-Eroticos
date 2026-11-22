import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AdminTitle } from "@/components/admin/AdminUi";
import { PageEditor } from "@/components/admin/PageEditor";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { getAllCategories, getAllPostTypes, getPlannedGamesForPage } from "@/lib/posts";

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const pageId = Number.parseInt(id, 10);
  if (!Number.isFinite(pageId)) notFound();
  const [rows, cats, types] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, pageId)).limit(1),
    getAllCategories(),
    getAllPostTypes(),
  ]);
  const page = rows[0];
  if (!page) notFound();
  const planned = page.type === "wishlist" ? await getPlannedGamesForPage(page.id) : [];

  return (
    <div>
      <AdminTitle title="Editar página" subtitle={page.title} />
      <PageEditor
        savedNotice={sp.ok === "creado" ? "¡Página creada correctamente!" : undefined}
        categories={cats.map((c) => ({ id: c.id, slug: c.slug, name: c.name, color: c.color }))}
        postTypes={types.map((t) => ({ slug: t.slug, name: t.name, icon: t.icon }))}
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: page.type,
          content: page.content,
          accessLevel: page.accessLevel,
          menuSection: page.menuSection,
          menuOrder: page.menuOrder,
          externalUrl: page.externalUrl,
          filters: page.filters ?? {},
          published: page.published,
          plannedGames: planned.map((g) => ({ id: g.id, name: g.name, categoryId: g.category?.id ?? null, description: g.description })),
        }}
      />
    </div>
  );
}
