import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/juegos", "/p/", "/juego/", "/vip", "/registro", "/cuenta"],
        disallow: ["/admin", "/login", "/api", "/_next"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
