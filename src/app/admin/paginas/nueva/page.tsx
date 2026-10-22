import { AdminTitle } from "@/components/admin/AdminUi";
import { PageEditor } from "@/components/admin/PageEditor";
import { getAllCategories, getAllPostTypes } from "@/lib/posts";

export default async function NewPagePage() {
  const [cats, types] = await Promise.all([getAllCategories(), getAllPostTypes()]);
  return (
    <div>
      <AdminTitle title="Nueva página" subtitle="Elige el tipo de página, su público y dónde aparece en el menú." />
      <PageEditor
        categories={cats.map((c) => ({ slug: c.slug, name: c.name }))}
        postTypes={types.map((t) => ({ slug: t.slug, name: t.name, icon: t.icon }))}
        initial={{
          title: "",
          slug: "",
          type: "content",
          content: "",
          accessLevel: "public",
          menuSection: "header",
          menuOrder: 50,
          externalUrl: "",
          filters: {},
          published: true,
        }}
      />
    </div>
  );
}
