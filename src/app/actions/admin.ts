"use server";

import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  categories,
  contactMessages,
  pages,
  plannedGames,
  postCategories,
  postTypes,
  posts,
  siteSettings,
  users,
  vipPlans,
  vipRequests,
  type AccessLevel,
  type DownloadLink,
  type DownloadLinkAccess,
  type MenuSection,
  type PageFilters,
  type PageType,
  type PostStatus,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_SETTINGS,
  isAccessLevel,
  isMenuSection,
  isPageType,
  normalizeSettings,
  type HomeSections,
  type SiteSettings,
  type SocialKey,
} from "@/lib/constants";
import { hashPassword, verifyPassword } from "@/lib/password";
import { int, slugify, str } from "@/lib/utils";
import type { FormState } from "./public";

export type SaveResult = { ok: boolean; error?: string; id?: number; slug?: string };

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

function clip(v: unknown, max = 500): string {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function refresh() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(
  table: "posts" | "pages" | "categories" | "post_types",
  base: string,
  excludeId?: number,
): Promise<string> {
  const clean = base || "item";
  let slug = clean;
  for (let i = 2; i < 500; i++) {
    const res = await db.execute(sql`select id from ${sql.identifier(table)} where slug = ${slug} limit 1`);
    const row = res.rows[0] as { id: number } | undefined;
    if (!row || Number(row.id) === excludeId) return slug;
    slug = `${clean}-${i}`;
  }
  return `${clean}-${Date.now()}`;
}

function computeVipUntil(current: Date | null, days: number): Date {
  if (days <= 0) return new Date("2100-01-01T00:00:00Z");
  const base = current && current.getTime() > Date.now() ? current.getTime() : Date.now();
  return new Date(base + days * 24 * 60 * 60 * 1000);
}

/* ----------------------------- Publicaciones ----------------------------- */

export type PostInput = {
  id?: number;
  title: string;
  slug: string;
  postTypeId: number | null;
  categoryIds: number[];
  primaryCategoryId: number | null;
  excerpt: string;
  description: string;
  rating: number;
  coverImage: string;
  gallery: string[];
  videoUrl: string;
  instructions: string;
  downloadLinks: DownloadLink[];
  platforms: string[];
  accessLevel: AccessLevel;
  version: string;
  developer: string;
  language: string;
  fileSize: string;
  status: PostStatus;
  featured: boolean;
};

export async function savePost(input: PostInput): Promise<SaveResult> {
  await requireAdmin();
  const title = clip(input.title, 200);
  if (!title) return { ok: false, error: "El título es obligatorio." };
  const existingId = input.id ? Number(input.id) : undefined;
  const slug = await uniqueSlug("posts", slugify(clip(input.slug, 120) || title), existingId);
  const accessLevel: AccessLevel = isAccessLevel(input.accessLevel) ? input.accessLevel : "public";
  const status: PostStatus = input.status === "draft" ? "draft" : "published";
  const rating = clamp(Number(input.rating) || 0, 0, 5);
  const catIds = Array.from(
    new Set((input.categoryIds ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0)),
  );
  const primaryRaw = Number(input.primaryCategoryId);
  const primaryCategoryId = Number.isInteger(primaryRaw) && catIds.includes(primaryRaw) ? primaryRaw : null;
  const values = {
    title,
    slug,
    postTypeId: input.postTypeId ? Number(input.postTypeId) : null,
    primaryCategoryId,
    excerpt: clip(input.excerpt, 600),
    description: clip(input.description, 60000),
    rating: Math.round(rating * 10) / 10,
    coverImage: clip(input.coverImage, 2000),
    gallery: (input.gallery ?? [])
      .map((g) => clip(g, 2000))
      .filter(Boolean)
      .slice(0, 80),
    videoUrl: clip(input.videoUrl, 2000),
    instructions: clip(input.instructions, 30000),
    downloadLinks: (input.downloadLinks ?? [])
      .map((l) => ({
        label: clip(l.label, 100) || "Descargar",
        url: clip(l.url, 2000),
        platform: clip(l.platform, 50),
        size: clip(l.size, 50),
        access: (l.access === "vip" ? "vip" : "common") as DownloadLinkAccess,
      }))
      .filter((l) => l.url)
      .slice(0, 40),
    platforms: Array.from(new Set((input.platforms ?? []).map((p) => clip(p, 40)).filter(Boolean))).slice(0, 20),
    accessLevel,
    version: clip(input.version, 60),
    developer: clip(input.developer, 120),
    language: clip(input.language, 120),
    fileSize: clip(input.fileSize, 40),
    status,
    featured: !!input.featured,
  };
  let postId = existingId;
  try {
    await db.transaction(async (tx) => {
      if (postId) {
        await tx
          .update(posts)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(posts.id, postId));
        await tx.delete(postCategories).where(eq(postCategories.postId, postId));
      } else {
        const [row] = await tx.insert(posts).values(values).returning({ id: posts.id });
        postId = row.id;
      }
      const pid = postId;
      if (catIds.length && pid) {
        await tx.insert(postCategories).values(catIds.map((categoryId) => ({ postId: pid, categoryId })));
      }
    });
  } catch (err) {
    console.error("[savePost]", err);
    return { ok: false, error: "No se pudo guardar la publicación. Revisa los datos e inténtalo de nuevo." };
  }
  refresh();
  return { ok: true, id: postId, slug };
}

export async function deletePostForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.delete(posts).where(eq(posts.id, id));
  refresh();
}

export async function togglePostFieldForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  const field = str(formData.get("field"));
  if (!id) return;
  if (field === "featured") {
    await db
      .update(posts)
      .set({ featured: sql`not ${posts.featured}` })
      .where(eq(posts.id, id));
  } else if (field === "status") {
    await db
      .update(posts)
      .set({ status: sql`case when ${posts.status} = 'published' then 'draft' else 'published' end` })
      .where(eq(posts.id, id));
  }
  refresh();
}

/* ------------------------------- Categorías ------------------------------ */

export async function saveCategoryForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  const name = str(formData.get("name"), 80);
  if (!name) return;
  const baseSlug = slugify(str(formData.get("slug"), 80) || name);
  if (!id) {
    const existing = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(or(ilike(categories.name, name), eq(categories.slug, baseSlug)))
      .limit(1);
    if (existing.length) return; // Evita duplicados por nombre o slug.
  }
  const slug = await uniqueSlug("categories", baseSlug, id || undefined);
  const colorRaw = str(formData.get("color"), 20);
  const values = {
    name,
    slug,
    color: HEX.test(colorRaw) ? colorRaw : "#ec4899",
    description: str(formData.get("description"), 500),
    sortOrder: int(formData.get("sortOrder")),
  };
  if (id) await db.update(categories).set(values).where(eq(categories.id, id));
  else await db.insert(categories).values(values);
  refresh();
}

export async function deleteCategoryForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.delete(categories).where(eq(categories.id, id));
  refresh();
}

export async function quickCreateCategory(
  name: string,
): Promise<{ ok: true; category: { id: number; name: string; slug: string; color: string } } | { ok: false; error: string }> {
  await requireAdmin();
  const clean = clip(name, 80);
  if (!clean) return { ok: false, error: "Escribe un nombre" };
  const slugBase = slugify(clean);
  const existing = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, color: categories.color })
    .from(categories)
    .where(or(ilike(categories.name, clean), eq(categories.slug, slugBase)))
    .limit(1);
  if (existing.length) {
    return { ok: true, category: existing[0] }; // Ya existe: devuelve la categoría en lugar de duplicar.
  }
  const slug = await uniqueSlug("categories", slugBase);
  const [row] = await db
    .insert(categories)
    .values({ name: clean, slug, sortOrder: 100 })
    .returning({ id: categories.id, name: categories.name, slug: categories.slug, color: categories.color });
  refresh();
  return { ok: true, category: row };
}

/* --------------------------- Tipos de publicación ------------------------ */

export async function savePostTypeForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  const name = str(formData.get("name"), 80);
  if (!name) return;
  const slug = await uniqueSlug("post_types", slugify(str(formData.get("slug"), 80) || name), id || undefined);
  const values = {
    name,
    slug,
    icon: str(formData.get("icon"), 16) || "🎮",
    description: str(formData.get("description"), 500),
    sortOrder: int(formData.get("sortOrder")),
  };
  if (id) await db.update(postTypes).set(values).where(eq(postTypes.id, id));
  else await db.insert(postTypes).values(values);
  refresh();
}

export async function deletePostTypeForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.delete(postTypes).where(eq(postTypes.id, id));
  refresh();
}

/* ---------------------------------- Páginas ------------------------------ */

export type PlannedGameInput = {
  id?: number;
  name: string;
  categoryId: number | null;
  description: string;
};

export type PageInput = {
  id?: number;
  title: string;
  slug: string;
  type: PageType;
  content: string;
  accessLevel: AccessLevel;
  menuSection: MenuSection;
  menuOrder: number;
  externalUrl: string;
  filters: PageFilters;
  published: boolean;
  plannedGames?: PlannedGameInput[];
};

export async function savePage(input: PageInput): Promise<SaveResult> {
  await requireAdmin();
  const title = clip(input.title, 120);
  if (!title) return { ok: false, error: "El título es obligatorio." };
  const type: PageType = isPageType(input.type) ? input.type : "content";
  if (type === "link" && !clip(input.externalUrl)) {
    return { ok: false, error: "Indica la dirección (URL) del enlace." };
  }
  const existingId = input.id ? Number(input.id) : undefined;
  const slug = await uniqueSlug("pages", slugify(clip(input.slug, 120) || title), existingId);
  const f = input.filters ?? {};
  const filters: PageFilters = {};
  if (clip(f.category)) filters.category = clip(f.category, 100);
  if (clip(f.platform)) filters.platform = clip(f.platform, 50);
  if (clip(f.postType)) filters.postType = clip(f.postType, 100);
  if (isAccessLevel(f.access)) filters.access = f.access;
  if (clip(f.sort)) filters.sort = clip(f.sort, 30);
  const values = {
    title,
    slug,
    type,
    content: clip(input.content, 60000),
    accessLevel: (isAccessLevel(input.accessLevel) ? input.accessLevel : "public") as AccessLevel,
    menuSection: (isMenuSection(input.menuSection) ? input.menuSection : "none") as MenuSection,
    menuOrder: Math.round(Number(input.menuOrder) || 0),
    externalUrl: clip(input.externalUrl, 2000),
    filters,
    published: !!input.published,
  };
  const planned = (input.plannedGames ?? [])
    .map((g) => ({
      name: clip(g.name, 200),
      categoryId: Number(g.categoryId) > 0 ? Number(g.categoryId) : null,
      description: clip(g.description, 2000),
    }))
    .filter((g) => g.name)
    .slice(0, 500);
  let id = existingId;
  try {
    await db.transaction(async (tx) => {
      if (id) {
        await tx
          .update(pages)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(pages.id, id));
      } else {
        const [row] = await tx.insert(pages).values(values).returning({ id: pages.id });
        id = row.id;
      }
      if (!id) return;
      if (type === "wishlist") {
        await tx.delete(plannedGames).where(eq(plannedGames.pageId, id));
        if (planned.length) {
          await tx.insert(plannedGames).values(
            planned.map((g, i) => ({ pageId: id as number, ...g, sortOrder: i })),
          );
        }
      } else {
        await tx.delete(plannedGames).where(eq(plannedGames.pageId, id));
      }
    });
  } catch (err) {
    console.error("[savePage]", err);
    return { ok: false, error: "No se pudo guardar la página. Revisa los datos e inténtalo de nuevo." };
  }
  refresh();
  return { ok: true, id };
}

export async function deletePageForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.delete(pages).where(eq(pages.id, id));
  refresh();
}

export async function updatePageMenuForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (!id) return;
  const section = str(formData.get("menuSection"));
  await db
    .update(pages)
    .set({
      menuSection: isMenuSection(section) ? section : "none",
      menuOrder: int(formData.get("menuOrder")),
      published: formData.get("published") === "on",
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id));
  refresh();
}

/* ------------------------------ Configuración ---------------------------- */

export async function saveSettings(input: SiteSettings): Promise<SaveResult> {
  await requireAdmin();
  const s = normalizeSettings(input as unknown as Record<string, unknown>);
  const target = s as Record<string, unknown>;
  for (const key of Object.keys(s) as (keyof SiteSettings)[]) {
    const v = s[key];
    if (typeof v === "string") target[key] = v.slice(0, 30000);
  }
  s.siteTitle = s.siteTitle.trim() || DEFAULT_SETTINGS.siteTitle;
  s.primaryColor = HEX.test(s.primaryColor) ? s.primaryColor : DEFAULT_SETTINGS.primaryColor;
  s.backgroundColor = HEX.test(s.backgroundColor) ? s.backgroundColor : DEFAULT_SETTINGS.backgroundColor;
  s.backgroundOverlay = clamp(Math.round(Number(s.backgroundOverlay) || 0), 0, 100);
  s.logoHeight = clamp(Math.round(Number(s.logoHeight) || 40), 16, 140);
  s.postsPerPage = clamp(Math.round(Number(s.postsPerPage) || 12), 4, 60);
  for (const key of Object.keys(s.home) as (keyof HomeSections)[]) s.home[key] = !!s.home[key];
  for (const key of Object.keys(s.socials) as SocialKey[]) {
    s.socials[key] = String(s.socials[key] ?? "")
      .trim()
      .slice(0, 500);
  }
  await db
    .insert(siteSettings)
    .values({ id: 1, data: s })
    .onConflictDoUpdate({ target: siteSettings.id, set: { data: s, updatedAt: new Date() } });
  refresh();
  return { ok: true };
}

/* --------------------------------- Usuarios ------------------------------ */

export async function setUserRoleForm(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = int(formData.get("id"));
  const role = formData.get("role") === "admin" ? "admin" : "user";
  if (!id || id === admin.user.id) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
  refresh();
}

export async function grantVipForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  const days = Math.max(0, int(formData.get("days"), 30));
  const [u] = await db.select({ vipUntil: users.vipUntil }).from(users).where(eq(users.id, id));
  if (!u) return;
  await db
    .update(users)
    .set({ vipUntil: computeVipUntil(u.vipUntil, days) })
    .where(eq(users.id, id));
  refresh();
}

export async function revokeVipForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.update(users).set({ vipUntil: null }).where(eq(users.id, id));
  refresh();
}

export async function deleteUserForm(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = int(formData.get("id"));
  if (!id || id === admin.user.id) return;
  await db.delete(users).where(eq(users.id, id));
  refresh();
}

/* ----------------------------------- VIP --------------------------------- */

export async function saveVipPlanForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  const name = str(formData.get("name"), 120);
  if (!name) return;
  const values = {
    name,
    price: str(formData.get("price"), 60),
    durationDays: Math.max(0, int(formData.get("durationDays"), 30)),
    description: str(formData.get("description"), 1000),
    paymentUrl: str(formData.get("paymentUrl"), 2000),
    active: formData.get("active") === "on",
    sortOrder: int(formData.get("sortOrder")),
  };
  if (id) await db.update(vipPlans).set(values).where(eq(vipPlans.id, id));
  else await db.insert(vipPlans).values(values);
  refresh();
}

export async function deleteVipPlanForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.delete(vipPlans).where(eq(vipPlans.id, id));
  refresh();
}

export async function reviewVipRequestForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  const decision = str(formData.get("decision"));
  const [request] = await db.select().from(vipRequests).where(eq(vipRequests.id, id));
  if (!request || request.status !== "pending") return;
  if (decision === "approve") {
    let days = 30;
    if (request.planId) {
      const [plan] = await db.select().from(vipPlans).where(eq(vipPlans.id, request.planId));
      if (plan) days = plan.durationDays;
    }
    const override = str(formData.get("days"));
    if (override !== "") days = Math.max(0, int(override, days));
    const [u] = await db.select({ vipUntil: users.vipUntil }).from(users).where(eq(users.id, request.userId));
    if (u) {
      await db
        .update(users)
        .set({ vipUntil: computeVipUntil(u.vipUntil, days) })
        .where(eq(users.id, request.userId));
    }
    await db.update(vipRequests).set({ status: "approved", reviewedAt: new Date() }).where(eq(vipRequests.id, id));
  } else {
    await db.update(vipRequests).set({ status: "rejected", reviewedAt: new Date() }).where(eq(vipRequests.id, id));
  }
  refresh();
}

/* -------------------------------- Mensajes ------------------------------- */

export async function toggleMessageReadForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (!id) return;
  await db
    .update(contactMessages)
    .set({ read: formData.get("read") === "1" })
    .where(eq(contactMessages.id, id));
  refresh();
}

export async function deleteMessageForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (id) await db.delete(contactMessages).where(eq(contactMessages.id, id));
  refresh();
}

/* -------------------------------- Seguridad ------------------------------ */

export async function changeAdminCredentialsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const username = str(formData.get("username"), 30);
  const email = str(formData.get("email"), 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const [row] = await db.select().from(users).where(eq(users.id, admin.user.id));
  if (!row || !verifyPassword(current, row.passwordHash)) {
    return { error: "La contraseña actual no es correcta." };
  }
  if (!USERNAME_RE.test(username)) return { error: "El usuario debe tener entre 3 y 30 caracteres válidos." };
  if (!EMAIL_RE.test(email)) return { error: "Introduce un correo electrónico válido." };
  const clash = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        ne(users.id, admin.user.id),
        or(sql`lower(${users.email}) = ${email}`, sql`lower(${users.username}) = ${username.toLowerCase()}`),
      ),
    )
    .limit(1);
  if (clash.length) return { error: "Ese usuario o correo ya lo usa otra cuenta." };
  const update: { username: string; email: string; passwordHash?: string } = { username, email };
  if (password) {
    if (password.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
    if (password !== confirm) return { error: "Las contraseñas nuevas no coinciden." };
    update.passwordHash = hashPassword(password);
  }
  await db.update(users).set(update).where(eq(users.id, admin.user.id));
  refresh();
  return {
    ok: true,
    message: password ? "Datos de acceso y contraseña actualizados correctamente." : "Datos de acceso actualizados.",
  };
}
