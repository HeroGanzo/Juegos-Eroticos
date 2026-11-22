import { AdminTitle } from "@/components/admin/AdminUi";
import { PostEditor } from "@/components/admin/PostEditor";
import { getAllCategories, getAllPostTypes } from "@/lib/posts";

export default async function NewPostPage() {
  const [cats, types] = await Promise.all([getAllCategories(), getAllPostTypes()]);
  const defaultType = types.find((t) => t.slug === "juego")?.id ?? types[0]?.id ?? null;
  return (
    <div>
      <AdminTitle title="Nueva publicación" subtitle="Rellena los datos del juego. Solo el título es obligatorio." />
      <PostEditor
        categories={cats.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        postTypes={types.map((t) => ({ id: t.id, name: t.name, icon: t.icon }))}
        initial={{
          title: "",
          slug: "",
          postTypeId: defaultType,
          categoryIds: [],
          excerpt: "",
          description: "",
          rating: 4,
          coverImage: "",
          gallery: [],
          videoUrl: "",
          instructions: "",
          downloadLinks: [],
          platforms: ["Windows"],
          accessLevel: "public",
          version: "",
          developer: "",
          language: "Español",
          fileSize: "",
          status: "published",
          featured: false,
          primaryCategoryId: null,
        }}
      />
    </div>
  );
}
