import type { MetadataRoute } from "next";
import { db } from "@/db";
import { pages, posts } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { siteBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteBaseUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/juegos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/vip`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/preguntas-frecuentes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    // Páginas públicas publicadas (no enlaces externos).
    const allPages = await db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt, published: pages.published, type: pages.type })
      .from(pages)
      .where(ne(pages.type, "link"));
    for (const p of allPages) {
      if (!p.published) continue;
      entries.push({
        url: `${base}/p/${p.slug}`,
        lastModified: p.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Fichas de juegos publicadas.
    const allPosts = await db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt, status: posts.status })
      .from(posts)
      .where(eq(posts.status, "published"));
    for (const p of allPosts) {
      entries.push({
        url: `${base}/juego/${p.slug}`,
        lastModified: p.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (err) {
    // Si la BD no está lista (primer despliegue), devolvemos las entradas estáticas.
    console.error("[sitemap] error consultando la BD:", err);
  }

  return entries;
}
