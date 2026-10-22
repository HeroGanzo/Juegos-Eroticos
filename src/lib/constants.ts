import type { AccessLevel, MenuSection, PageType } from "@/db/schema";

export const ACCESS_LEVELS: AccessLevel[] = ["public", "registered", "vip"];

export const ACCESS_RANK: Record<AccessLevel, number> = {
  public: 0,
  registered: 1,
  vip: 2,
};

export const ACCESS_INFO: Record<
  AccessLevel,
  { label: string; short: string; description: string; badge: string }
> = {
  public: {
    label: "Público (mayores de edad)",
    short: "Público",
    description: "Visible para cualquier visitante que confirme ser mayor de edad.",
    badge: "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
  },
  registered: {
    label: "Solo usuarios registrados",
    short: "Registrados",
    description: "Contenido más explícito, solo para usuarios con cuenta.",
    badge: "border-sky-400/40 bg-sky-500/20 text-sky-200",
  },
  vip: {
    label: "VIP (donadores / suscriptores)",
    short: "VIP",
    description: "Contenido especial para quienes donan o pagan una suscripción.",
    badge: "border-amber-400/50 bg-amber-500/25 text-amber-200",
  },
};

export function isAccessLevel(v: unknown): v is AccessLevel {
  return v === "public" || v === "registered" || v === "vip";
}

export const PLATFORMS = ["Windows", "Android", "Mac", "Linux", "iOS", "Web"];

export const PAGE_TYPES: { value: PageType; label: string; description: string }[] = [
  { value: "content", label: "Página de contenido", description: "Texto libre con formato: términos, noticias, información, etc." },
  { value: "games", label: "Lista de juegos", description: "Listado filtrado por categoría, plataforma, tipo de publicación o acceso." },
  { value: "categories", label: "Categorías", description: "Muestra todas las categorías con su número de juegos." },
  { value: "about", label: "Sobre mí", description: "Muestra la sección «Sobre mí» configurada en el panel." },
  { value: "contact", label: "Contacto", description: "Datos de contacto, redes sociales y formulario de contacto." },
  { value: "vip", label: "Planes VIP", description: "Planes de donación/suscripción y solicitud de acceso VIP." },
  { value: "link", label: "Enlace de menú", description: "Enlace interno o externo (por ejemplo /juegos o https://...)." },
];

export function isPageType(v: unknown): v is PageType {
  return PAGE_TYPES.some((p) => p.value === v);
}

export const MENU_SECTIONS: { value: MenuSection; label: string }[] = [
  { value: "header", label: "Menú principal (cabecera)" },
  { value: "footer", label: "Pie de página" },
  { value: "both", label: "Cabecera y pie de página" },
  { value: "none", label: "Oculto (no aparece en menús)" },
];

export function isMenuSection(v: unknown): v is MenuSection {
  return MENU_SECTIONS.some((m) => m.value === v);
}

export const SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "populares", label: "Más vistos" },
  { value: "puntuacion", label: "Mejor puntuados" },
  { value: "nombre", label: "Nombre (A-Z)" },
];

export const SOCIAL_NETWORKS = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "+34 600 000 000 o https://wa.me/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/tu-pagina" },
  { key: "instagram", label: "Instagram", placeholder: "@usuario o https://instagram.com/..." },
  { key: "telegram", label: "Telegram", placeholder: "@canal o https://t.me/..." },
  { key: "twitter", label: "X / Twitter", placeholder: "@usuario o https://x.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@canal" },
  { key: "tiktok", label: "TikTok", placeholder: "@usuario o https://tiktok.com/@..." },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/invitacion" },
  { key: "reddit", label: "Reddit", placeholder: "https://reddit.com/r/..." },
  { key: "patreon", label: "Patreon", placeholder: "https://patreon.com/..." },
  { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/..." },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "threads", label: "Threads", placeholder: "@usuario" },
  { key: "bluesky", label: "Bluesky", placeholder: "usuario.bsky.social" },
  { key: "website", label: "Otro sitio web", placeholder: "https://..." },
] as const;

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]["key"];

export type HomeSections = {
  showPlatforms: boolean;
  showFeatured: boolean;
  showCategories: boolean;
  showLatest: boolean;
  showVip: boolean;
  showAccessTiers: boolean;
};

export type SiteSettings = {
  siteTitle: string;
  tagline: string;
  logoUrl: string;
  logoHeight: number;
  faviconUrl: string;
  primaryColor: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundOverlay: number;
  heroEnabled: boolean;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  home: HomeSections;
  footerText: string;
  footerAbout: string;
  aboutTitle: string;
  aboutText: string;
  aboutImage: string;
  contactTitle: string;
  contactText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactFormEnabled: boolean;
  socials: Record<SocialKey, string>;
  ageGateEnabled: boolean;
  ageGateTitle: string;
  ageGateText: string;
  ageGateExitUrl: string;
  vipTitle: string;
  vipText: string;
  vipBenefits: string;
  paymentInstructions: string;
  allowRegistration: boolean;
  postsPerPage: number;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Juegos Eróticos",
  tagline: "Los mejores juegos para adultos para Windows y Android",
  logoUrl: "",
  logoHeight: 40,
  faviconUrl: "",
  primaryColor: "#ec4899",
  backgroundColor: "#0b0710",
  backgroundImage: "",
  backgroundOverlay: 85,
  heroEnabled: true,
  heroImage: "/images/hero.jpg",
  heroTitle: "Juegos Eróticos",
  heroSubtitle:
    "Descubre y descarga los mejores juegos para adultos para Windows y Android. Regístrate gratis para ver contenido más explícito y hazte VIP para desbloquear los exclusivos.",
  heroButtonText: "Explorar juegos",
  heroButtonLink: "/juegos",
  home: {
    showPlatforms: true,
    showFeatured: true,
    showCategories: true,
    showLatest: true,
    showVip: true,
    showAccessTiers: true,
  },
  footerText: "© {year} Juegos Eróticos. Todos los derechos reservados. Sitio exclusivo para mayores de 18 años.",
  footerAbout:
    "Tu sitio de confianza para descubrir juegos para adultos: novelas visuales, RPG, simuladores y mucho más, para Windows y Android.",
  aboutTitle: "Sobre mí",
  aboutText:
    "¡Hola! Soy un apasionado de los juegos para adultos y creé este sitio para compartir los mejores títulos para **Windows** y **Android**.\n\nAquí encontrarás novelas visuales, RPG, simuladores y traducciones al español, todo revisado y organizado por categorías.\n\nSi te gusta el proyecto, puedes apoyarlo haciéndote **VIP**: tendrás acceso a contenido exclusivo y ayudarás a mantener el sitio activo.",
  aboutImage: "",
  contactTitle: "Contacto",
  contactText:
    "¿Tienes dudas, sugerencias o quieres proponer un juego? Escríbeme por cualquiera de estos medios o usa el formulario.",
  contactEmail: "contacto@juegoseroticos.com",
  contactPhone: "",
  contactAddress: "",
  contactFormEnabled: true,
  socials: {
    whatsapp: "",
    facebook: "",
    instagram: "",
    telegram: "https://t.me/",
    twitter: "",
    youtube: "",
    tiktok: "",
    discord: "https://discord.gg/",
    reddit: "",
    patreon: "https://patreon.com/",
    twitch: "",
    pinterest: "",
    threads: "",
    bluesky: "",
    website: "",
  },
  ageGateEnabled: true,
  ageGateTitle: "Advertencia: contenido para adultos",
  ageGateText:
    "Este sitio web contiene material con contenido sexual explícito destinado únicamente a personas adultas.\n\nPara continuar debes confirmar que tienes al menos 18 años (o la mayoría de edad legal en tu país) y que el contenido para adultos no te ofende.",
  ageGateExitUrl: "https://www.google.com",
  vipTitle: "Hazte VIP",
  vipText:
    "Apoya el sitio con una donación o una suscripción y desbloquea todo el contenido exclusivo: juegos completos, versiones sin censura, actualizaciones anticipadas y enlaces directos.",
  vipBenefits:
    "Acceso a todos los juegos y publicaciones VIP\nVersiones completas y sin censura\nEnlaces de descarga directos y rápidos\nActualizaciones anticipadas\nSoporte prioritario",
  paymentInstructions:
    "1. Elige un plan y realiza el pago o la donación con el botón del plan.\n2. Copia el número de transacción o referencia del pago.\n3. Envía el formulario de solicitud VIP con esos datos.\n4. Un administrador verificará el pago y activará tu acceso VIP.",
  allowRegistration: true,
  postsPerPage: 12,
};

export function normalizeSettings(raw: Record<string, unknown> | null | undefined): SiteSettings {
  const data = (raw ?? {}) as Partial<SiteSettings>;
  const merged: SiteSettings = {
    ...DEFAULT_SETTINGS,
    ...data,
    home: { ...DEFAULT_SETTINGS.home, ...(data.home ?? {}) },
    socials: { ...DEFAULT_SETTINGS.socials, ...(data.socials ?? {}) },
  };
  const target = merged as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    if (typeof DEFAULT_SETTINGS[key] !== typeof merged[key]) {
      target[key] = DEFAULT_SETTINGS[key];
    }
  }
  return merged;
}

export function pageHref(p: { type: PageType; slug: string; externalUrl: string }): string {
  return p.type === "link" ? p.externalUrl || "/" : `/p/${p.slug}`;
}

export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function socialUrl(key: string, value: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  if (key === "whatsapp") return `https://wa.me/${v.replace(/[^\d]/g, "")}`;
  if (key === "telegram") return `https://t.me/${v.replace(/^@/, "")}`;
  const bases: Record<string, string> = {
    instagram: "https://instagram.com/",
    twitter: "https://x.com/",
    tiktok: "https://www.tiktok.com/@",
    youtube: "https://youtube.com/@",
    facebook: "https://facebook.com/",
    reddit: "https://reddit.com/user/",
    patreon: "https://patreon.com/",
    twitch: "https://twitch.tv/",
    pinterest: "https://pinterest.com/",
    threads: "https://www.threads.net/@",
    bluesky: "https://bsky.app/profile/",
    discord: "https://discord.gg/",
  };
  const handle = v.replace(/^@/, "");
  if (bases[key] && (v.startsWith("@") || !v.includes("."))) return bases[key] + handle;
  if (key === "bluesky") return bases.bluesky + handle;
  return `https://${v}`;
}
