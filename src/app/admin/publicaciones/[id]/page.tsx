import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/AdminUi";
import { PostEditor } from "@/components/admin/PostEditor";
import { getAllCategories, getAllPostTypes, getPostById } from "@/lib/posts";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const postId = Number.parseInt(id, 10);
  if (!Number.isFinite(postId)) notFound();
  const [post, cats, types] = await Promise.all([getPostById(postId), getAllCategories(), getAllPostTypes()]);
  if (!post) notFound();

  return (
    <div>
      <AdminTitle title="Editar publicación" subtitle={post.title} />
      <PostEditor
        savedNotice={sp.ok === "creado" ? "¡Publicación creada correctamente!" : undefined}
        categories={cats.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        postTypes={types.map((t) => ({ id: t.id, name: t.name, icon: t.icon }))}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          postTypeId: post.postTypeId,
          categoryIds: post.categoryIds,
          excerpt: post.excerpt,
          description: post.description,
          rating: post.rating,
          coverImage: post.coverImage,
          gallery: post.gallery ?? [],
          videoUrl: post.videoUrl,
          instructions: post.instructions,
          downloadLinks: post.downloadLinks ?? [],
          platforms: post.platforms ?? [],
          accessLevel: post.accessLevel,
          version: post.version,
          developer: post.developer,
          language: post.language,
          fileSize: post.fileSize,
          status: post.status,
          featured: post.featured,
          primaryCategoryId: post.primaryCategoryId ?? null,
        }}
      />
    </div>
  );
}
