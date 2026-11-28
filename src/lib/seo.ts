import type { Metadata } from "next";
import { getSettings } from "./settings";

/** URL base canónica del sitio (usada en sitemap, robots, enlaces canónicos y datos estructurados). */
export async function siteBaseUrl(): Promise<string> {
  const s = await getSettings();
  return (s.siteUrl && /^https?:\/\//i.test(s.siteUrl) ? s.siteUrl : "https://juegosparaelganso.com").replace(/\/$/, "");
}

/** Ruta absoluta a partir de una ruta relativa. */
export async function absolutePath(path: string): Promise<string> {
  return `${await siteBaseUrl()}${path}`;
}

/** JSON-LD listo para insertar en <script type="application/ld+json">. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/** Metadatos base compartidos por todas las páginas públicas. */
export async function baseMetadata(opts: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Promise<Metadata> {
  const base = await siteBaseUrl();
  const path = opts.path ?? "/";
  const canonical = `${base}${path}`;
  return {
    title: opts.title,
    description: opts.description,
    authors: [{ name: "Juegos Eróticos" }],
    publisher: "Juegos Eróticos",
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      type: "website",
      locale: "es_ES",
      siteName: "Juegos Eróticos",
      url: canonical,
      images: opts.image
        ? [{ url: opts.image, width: 1200, height: 630, alt: opts.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: opts.image ? [opts.image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical,
    },
  } as Metadata;
}

/** Datos estructurados Organization (sitio). */
export function organizationJsonLd(socials: Record<string, string>, url: string) {
  const sameAs = Object.values(socials)
    .filter(Boolean)
    .map((v) => v.trim());
  return {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: "Juegos Eróticos",
    url,
    logo: `${url}/icon.svg`,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Datos estructurados WebSite con acción de búsqueda (sitelinks de búsqueda en Google). */
export function webSiteJsonLd(url: string) {
  return {
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url,
    name: "Juegos Eróticos",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/juegos?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Datos estructurados BreadcrumbList. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Datos estructurados Videojuego descargable (página de ficha de juego). */
export function videoGameJsonLd(opts: {
  url: string;
  name: string;
  description?: string;
  image?: string;
  genre?: string[];
  platforms?: string[];
  publisher?: string;
}) {
  return {
    "@type": "VideoGame",
    "@id": opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    image: opts.image,
    ...(opts.genre?.length ? { genre: opts.genre } : {}),
    ...(opts.platforms?.length ? { gamePlatform: opts.platforms } : {}),
    isFamilyFriendly: false,
    contentRating: "Adults only 18+",
    ...(opts.publisher ? { publisher: { "@type": "Organization", name: opts.publisher } } : {}),
    audience: { "@type": "People", audienceType: "Adults", requiredMinAge: 18 },
  };
}

/** Datos estructurados FAQPage (para asistentes de IA y resultados enriquecidos). */
export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
