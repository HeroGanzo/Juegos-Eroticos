import { and, asc, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  pages,
  plannedGames,
  postCategories,
  postTypes,
  posts,
  type AccessLevel,
  type PostStatus,
} from "@/db/schema";
import { isAccessLevel } from "./constants";

export type CategoryRef = { id: number; name: string; slug: string; color: string };
export type PostTypeRef = { id: number; name: string; slug: string; icon: string };

export type PostListItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  platforms: string[];
  accessLevel: AccessLevel;
  featured: boolean;
  views: number;
  status: PostStatus;
  createdAt: Date;
  postType: PostTypeRef | null;
  categories: CategoryRef[];
};

export type PostSearch = {
  q?: string;
  category?: string;
  platform?: string;
  postType?: string;
  access?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  featured?: boolean;
  excludeId?: number;
  categoryIds?: number[];
  includeDrafts?: boolean;
  status?: string;
};

export type PostSearchResult = { items: PostListItem[]; total: number; page: number; pages: number };

function orderFor(sort?: string) {
  switch (sort) {
    case "populares":
      return [desc(posts.views), desc(posts.createdAt)];
    case "puntuacion":
      return [desc(posts.rating), desc(posts.createdAt)];
    case "nombre":
      return [asc(posts.title)];
    default:
      return [desc(posts.createdAt), desc(posts.id)];
  }
}

export async function getCategoriesForPosts(ids: number[]): Promise<Map<number, CategoryRef[]>> {
  const map = new Map<number, CategoryRef[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({
      postId: postCategories.postId,
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      color: categories.color,
    })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(inArray(postCategories.postId, ids))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  for (const r of rows) {
    const list = map.get(r.postId) ?? [];
    list.push({ id: r.id, name: r.name, slug: r.slug, color: r.color });
    map.set(r.postId, list);
  }
  return map;
}

export async function searchPosts(s: PostSearch): Promise<PostSearchResult> {
  const conds: SQL[] = [];
  if (!s.includeDrafts) conds.push(eq(posts.status, "published"));
  if (s.status === "published" || s.status === "draft") conds.push(eq(posts.status, s.status));
  const q = s.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    const match = or(
      ilike(posts.title, pattern),
      ilike(posts.developer, pattern),
      sql`exists (select 1 from post_categories pc inner join categories c on c.id = pc.category_id where pc.post_id = ${posts.id} and c.name ilike ${pattern})`,
    );
    if (match) conds.push(match);
  }
  if (s.category) {
    conds.push(
      sql`exists (select 1 from post_categories pc inner join categories c on c.id = pc.category_id where pc.post_id = ${posts.id} and c.slug = ${s.category})`,
    );
  }
  if (s.platform) conds.push(sql`${posts.platforms} @> ${JSON.stringify([s.platform])}::jsonb`);
  if (s.postType) conds.push(eq(postTypes.slug, s.postType));
  if (s.access && isAccessLevel(s.access)) conds.push(eq(posts.accessLevel, s.access));
  if (s.featured) conds.push(eq(posts.featured, true));
  if (s.excludeId) conds.push(ne(posts.id, s.excludeId));
  if (s.categoryIds && s.categoryIds.length) {
    conds.push(
      sql`exists (select 1 from post_categories pc where pc.post_id = ${posts.id} and pc.category_id in (${sql.join(
        s.categoryIds.map((id) => sql`${id}`),
        sql`, `,
      )}))`,
    );
  }
  const where = conds.length ? and(...conds) : undefined;
  const perPage = Math.min(Math.max(s.perPage ?? 12, 1), 100);
  const page = Math.max(1, s.page ?? 1);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .leftJoin(postTypes, eq(posts.postTypeId, postTypes.id))
    .where(where);

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      rating: posts.rating,
      platforms: posts.platforms,
      accessLevel: posts.accessLevel,
      featured: posts.featured,
      views: posts.views,
      status: posts.status,
      createdAt: posts.createdAt,
      typeId: postTypes.id,
      typeName: postTypes.name,
      typeSlug: postTypes.slug,
      typeIcon: postTypes.icon,
    })
    .from(posts)
    .leftJoin(postTypes, eq(posts.postTypeId, postTypes.id))
    .where(where)
    .orderBy(...orderFor(s.sort))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const cats = await getCategoriesForPosts(rows.map((r) => r.id));
  const items: PostListItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    coverImage: r.coverImage,
    rating: r.rating,
    platforms: r.platforms ?? [],
    accessLevel: r.accessLevel,
    featured: r.featured,
    views: r.views,
    status: r.status,
    createdAt: r.createdAt,
    postType:
      r.typeId !== null
        ? { id: r.typeId, name: r.typeName ?? "", slug: r.typeSlug ?? "", icon: r.typeIcon ?? "" }
        : null,
    categories: cats.get(r.id) ?? [],
  }));
  return { items, total: count, page, pages: Math.max(1, Math.ceil(count / perPage)) };
}

export async function getPostBySlug(slug: string) {
  const rows = await db
    .select({ post: posts, type: postTypes })
    .from(posts)
    .leftJoin(postTypes, eq(posts.postTypeId, postTypes.id))
    .where(eq(posts.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const cats = await getCategoriesForPosts([row.post.id]);
  return { ...row.post, postType: row.type, categories: cats.get(row.post.id) ?? [] };
}

export type FullPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

export async function getPostById(id: number) {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const post = rows[0];
  if (!post) return null;
  const cats = await db
    .select({ id: postCategories.categoryId })
    .from(postCategories)
    .where(eq(postCategories.postId, id));
  return { ...post, categoryIds: cats.map((c) => c.id) };
}

export async function incrementViews(id: number): Promise<void> {
  await db
    .update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.id, id));
}

export async function getCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      color: categories.color,
      description: categories.description,
      sortOrder: categories.sortOrder,
      /** Publicaciones visibles en el sitio (publicadas). */
      count: sql<number>`(select count(distinct p.id)::int from post_categories pc inner join posts p on p.id = pc.post_id where pc.category_id = ${categories.id} and p.status = 'published')`,
      /** Publicaciones en borrador (solo para el panel admin). */
      draftCount: sql<number>`(select count(distinct p.id)::int from post_categories pc inner join posts p on p.id = pc.post_id where pc.category_id = ${categories.id} and p.status = 'draft')`,
      /** Total asignado a la categoría (publicadas + borradores). */
      totalCount: sql<number>`(select count(distinct p.id)::int from post_categories pc inner join posts p on p.id = pc.post_id where pc.category_id = ${categories.id})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export type PlannedGameItem = {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  category: CategoryRef | null;
};

export async function getPlannedGamesForPage(pageId: number): Promise<PlannedGameItem[]> {
  const rows = await db
    .select({
      id: plannedGames.id,
      name: plannedGames.name,
      description: plannedGames.description,
      sortOrder: plannedGames.sortOrder,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(plannedGames)
    .leftJoin(categories, eq(plannedGames.categoryId, categories.id))
    .where(eq(plannedGames.pageId, pageId))
    .orderBy(asc(plannedGames.sortOrder), asc(plannedGames.id));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    sortOrder: r.sortOrder,
    category:
      r.categoryId !== null
        ? { id: r.categoryId, name: r.categoryName ?? "", slug: r.categorySlug ?? "", color: r.categoryColor ?? "#ec4899" }
        : null,
  }));
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getAllPostTypes() {
  return db.select().from(postTypes).orderBy(asc(postTypes.sortOrder), asc(postTypes.name));
}

export async function getMenuPages() {
  try {
    return await db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        type: pages.type,
        externalUrl: pages.externalUrl,
        menuSection: pages.menuSection,
        menuOrder: pages.menuOrder,
        accessLevel: pages.accessLevel,
      })
      .from(pages)
      .where(and(eq(pages.published, true), ne(pages.menuSection, "none")))
      .orderBy(asc(pages.menuOrder), asc(pages.id));
  } catch (err) {
    console.error("[menu] failed", err);
    return [];
  }
}

export async function getPageBySlug(slug: string) {
  const rows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return rows[0] ?? null;
}
