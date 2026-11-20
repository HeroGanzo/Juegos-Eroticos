import { sql } from "drizzle-orm";
import { db } from "@/db";
import { SCHEMA_STATEMENTS, SCHEMA_TABLES } from "@/db/bootstrap-sql";
import {
  categories,
  pages,
  postCategories,
  postTypes,
  posts,
  siteSettings,
  users,
  vipPlans,
  type AccessLevel,
  type DownloadLink,
  type MenuSection,
  type PageFilters,
  type PageType,
} from "@/db/schema";
import { DEFAULT_SETTINGS } from "./constants";
import { hashPassword } from "./password";
import { slugify } from "./utils";

export const DEFAULT_ADMIN = {
  username: "admin",
  email: "admin@juegoseroticos.com",
  password: "admin123",
};

const CATEGORY_SEED = [
  { name: "Visual Novel", color: "#ec4899", description: "Historias interactivas con decisiones y múltiples finales." },
  { name: "RPG", color: "#8b5cf6", description: "Juegos de rol con combates, misiones y progresión." },
  { name: "Simulación", color: "#06b6d4", description: "Simuladores de citas, vida y gestión." },
  { name: "Aventura", color: "#f59e0b", description: "Exploración, puzles y narrativa." },
  { name: "Romance", color: "#f43f5e", description: "Relaciones, citas y amor." },
  { name: "Fantasía", color: "#10b981", description: "Magia, criaturas y mundos fantásticos." },
  { name: "Ciencia ficción", color: "#3b82f6", description: "Futuro, espacio y tecnología." },
  { name: "Sandbox", color: "#84cc16", description: "Mundos abiertos y libertad total." },
  { name: "Misterio", color: "#a855f7", description: "Intriga, secretos y suspense." },
  { name: "Terror", color: "#ef4444", description: "Horror gótico y sobrenatural." },
  { name: "3DCG", color: "#14b8a6", description: "Gráficos renderizados en 3D." },
  { name: "Animado", color: "#e879f9", description: "Escenas con animaciones." },
  { name: "En español", color: "#facc15", description: "Juegos traducidos o creados en español." },
];

const TYPE_SEED = [
  { name: "Juego", icon: "🎮", description: "Juegos completos, demos y episodios." },
  { name: "Mod", icon: "🧩", description: "Modificaciones y contenido extra." },
  { name: "Traducción", icon: "🌐", description: "Parches y traducciones al español." },
  { name: "Guía", icon: "📖", description: "Guías, walkthroughs y trucos." },
  { name: "Noticia", icon: "📰", description: "Novedades y actualizaciones." },
];

const WIN_ANDROID_INSTRUCTIONS = `### Windows
1. Descarga el archivo desde cualquiera de los enlaces de descarga.
2. Descomprime el archivo con **7-Zip** o **WinRAR**.
3. Abre la carpeta y ejecuta el archivo **.exe** del juego.
4. Si Windows muestra una advertencia, pulsa *Más información → Ejecutar de todas formas*.

### Android
1. Descarga el archivo **.apk**.
2. Ve a *Ajustes → Seguridad* y activa **Instalar apps de fuentes desconocidas**.
3. Abre el APK descargado e instálalo.
4. ¡Listo! Busca el icono del juego en tu pantalla de inicio.`;

const WIN_INSTRUCTIONS = `1. Descarga el archivo desde uno de los enlaces.
2. Descomprime con **7-Zip** o **WinRAR** (contraseña: \`juegoseroticos\`).
3. Ejecuta el archivo **.exe**.
4. Para guardar tu progreso, no muevas la carpeta *saves*.`;

type PostSeed = {
  title: string;
  type: string;
  cats: string[];
  excerpt: string;
  description: string;
  rating: number;
  cover: string;
  gallery: string[];
  platforms: string[];
  access: AccessLevel;
  version: string;
  developer: string;
  language: string;
  fileSize: string;
  featured: boolean;
  links: DownloadLink[];
  instructions: string;
  daysAgo: number;
  views: number;
};

const POST_SEED: PostSeed[] = [
  {
    title: "Neon Nights: Amor en la Ciudad",
    type: "juego",
    cats: ["visual-novel", "romance", "ciencia-ficcion", "en-espanol"],
    excerpt: "Una novela visual romántica en una metrópolis cyberpunk donde cada decisión cambia tu destino.",
    description:
      "**Neon Nights** te lleva a una ciudad futurista donde la lluvia nunca cesa y las luces de neón esconden secretos.\n\nInterpretas a un detective privado que, tras aceptar un caso misterioso, termina envuelto en una historia de romance, traición y deseo.\n\n### Características\n- Más de 12 finales diferentes.\n- 6 personajes con rutas románticas propias.\n- Escenas animadas y banda sonora original.\n- Totalmente traducido al español.",
    rating: 4.5,
    cover: "/images/cover-neon.jpg",
    gallery: ["/images/cover-space.jpg", "/images/hero.jpg", "/images/cover-masquerade.jpg"],
    platforms: ["Windows", "Android"],
    access: "public",
    version: "v1.2",
    developer: "Midnight Studio",
    language: "Español, Inglés",
    fileSize: "1.4 GB",
    featured: true,
    links: [
      { label: "MEGA", url: "https://mega.nz/", platform: "Windows", size: "1.4 GB" },
      { label: "Google Drive", url: "https://drive.google.com/", platform: "Windows", size: "1.4 GB" },
      { label: "MediaFire (APK)", url: "https://www.mediafire.com/", platform: "Android", size: "780 MB" },
    ],
    instructions: WIN_ANDROID_INSTRUCTIONS,
    daysAgo: 1,
    views: 1520,
  },
  {
    title: "La Hechicera del Bosque Eterno",
    type: "juego",
    cats: ["rpg", "fantasia", "aventura"],
    excerpt: "Un RPG de fantasía donde una hechicera elfa guarda secretos muy tentadores.",
    description:
      "Explora un bosque encantado lleno de criaturas mágicas, misiones secundarias y relaciones que evolucionan según tus decisiones.\n\n### Características\n- Sistema de combate por turnos.\n- Más de 40 horas de juego.\n- Galería desbloqueable con escenas especiales.\n- Contenido más explícito exclusivo para usuarios registrados.",
    rating: 4,
    cover: "/images/cover-sorceress.jpg",
    gallery: ["/images/cover-vampire.jpg", "/images/cover-island.jpg"],
    platforms: ["Windows"],
    access: "registered",
    version: "v0.9 Beta",
    developer: "Elven Forge",
    language: "Español",
    fileSize: "2.1 GB",
    featured: true,
    links: [
      { label: "MEGA", url: "https://mega.nz/", platform: "Windows", size: "2.1 GB" },
      { label: "Pixeldrain", url: "https://pixeldrain.com/", platform: "Windows", size: "2.1 GB" },
    ],
    instructions: WIN_INSTRUCTIONS,
    daysAgo: 3,
    views: 980,
  },
  {
    title: "Mascarada Prohibida",
    type: "juego",
    cats: ["visual-novel", "romance", "misterio", "animado"],
    excerpt: "Un baile de máscaras en un palacio barroco donde nada es lo que parece.",
    description:
      "Recibes una invitación anónima a la fiesta más exclusiva de la ciudad. Detrás de cada máscara hay un secreto… y una tentación.\n\n### Contenido VIP\n- Versión completa sin censura.\n- Todas las escenas animadas en alta calidad.\n- Galería completa desbloqueada.\n- Actualizaciones anticipadas.",
    rating: 4.8,
    cover: "/images/cover-masquerade.jpg",
    gallery: ["/images/cover-neon.jpg", "/images/cover-vampire.jpg"],
    platforms: ["Windows", "Mac"],
    access: "vip",
    version: "v2.0",
    developer: "Velvet Mask Games",
    language: "Español, Inglés",
    fileSize: "3.2 GB",
    featured: true,
    links: [
      { label: "Descarga directa VIP", url: "https://mega.nz/", platform: "Windows", size: "3.2 GB" },
      { label: "Descarga directa VIP (Mac)", url: "https://mega.nz/", platform: "Mac", size: "3.3 GB" },
    ],
    instructions: WIN_INSTRUCTIONS,
    daysAgo: 2,
    views: 2210,
  },
  {
    title: "Verano en Isla Paraíso",
    type: "juego",
    cats: ["simulacion", "romance", "sandbox", "en-espanol"],
    excerpt: "Simulador de citas en una isla tropical: playa, fiestas y romances de verano.",
    description:
      "Pasa el mejor verano de tu vida en una isla paradisíaca. Trabaja en el chiringuito, organiza fiestas y conquista a los demás huéspedes del resort.\n\n- Mundo abierto con ciclo día/noche.\n- Mini-juegos y eventos especiales.\n- Disponible para Android y Windows.",
    rating: 4.2,
    cover: "/images/cover-island.jpg",
    gallery: ["/images/cover-neon.jpg", "/images/cover-space.jpg"],
    platforms: ["Android", "Windows"],
    access: "public",
    version: "v1.5",
    developer: "Sunny Bits",
    language: "Español",
    fileSize: "900 MB",
    featured: false,
    links: [
      { label: "APK - MediaFire", url: "https://www.mediafire.com/", platform: "Android", size: "650 MB" },
      { label: "PC - MEGA", url: "https://mega.nz/", platform: "Windows", size: "900 MB" },
    ],
    instructions: WIN_ANDROID_INSTRUCTIONS,
    daysAgo: 5,
    views: 1340,
  },
  {
    title: "Sangre y Seducción",
    type: "juego",
    cats: ["visual-novel", "terror", "fantasia", "3dcg"],
    excerpt: "Romance gótico con una condesa vampira en un castillo bajo la luna.",
    description:
      "Un viajero perdido encuentra refugio en un castillo antiguo. Su anfitriona, una misteriosa condesa, tiene planes para él.\n\n- Gráficos 3DCG de alta calidad.\n- Ambientación gótica y banda sonora orquestal.\n- Episodio 4 exclusivo para miembros VIP.",
    rating: 4.6,
    cover: "/images/cover-vampire.jpg",
    gallery: ["/images/cover-masquerade.jpg", "/images/cover-sorceress.jpg"],
    platforms: ["Windows", "Linux"],
    access: "vip",
    version: "Episodio 4",
    developer: "Crimson Moon",
    language: "Inglés (traducción al español incluida)",
    fileSize: "4.5 GB",
    featured: true,
    links: [
      { label: "MEGA VIP", url: "https://mega.nz/", platform: "Windows", size: "4.5 GB" },
      { label: "Linux VIP", url: "https://mega.nz/", platform: "Linux", size: "4.4 GB" },
    ],
    instructions: WIN_INSTRUCTIONS,
    daysAgo: 4,
    views: 1875,
  },
  {
    title: "Capitana de las Estrellas",
    type: "juego",
    cats: ["simulacion", "ciencia-ficcion", "aventura"],
    excerpt: "Gestiona tu nave, recluta tripulación y vive romances entre las estrellas.",
    description:
      "Toma el mando de una estación espacial al borde de la galaxia. Gestiona recursos, explora planetas y conoce a una tripulación muy especial.\n\n- Gestión de nave y tripulación.\n- Eventos aleatorios y múltiples finales.\n- Optimizado para Android.",
    rating: 3.9,
    cover: "/images/cover-space.jpg",
    gallery: ["/images/cover-neon.jpg"],
    platforms: ["Android"],
    access: "registered",
    version: "v0.7",
    developer: "Nova Dreams",
    language: "Español",
    fileSize: "520 MB",
    featured: false,
    links: [{ label: "APK - Google Drive", url: "https://drive.google.com/", platform: "Android", size: "520 MB" }],
    instructions: WIN_ANDROID_INSTRUCTIONS,
    daysAgo: 6,
    views: 760,
  },
  {
    title: "Parche en español: Mascarada Prohibida",
    type: "traduccion",
    cats: ["en-espanol", "visual-novel"],
    excerpt: "Traducción completa al español para Mascarada Prohibida v2.0.",
    description:
      "Traducción 100% al español de todos los textos, menús e interfaz.\n\n**Compatible con:** Mascarada Prohibida v2.0 (Windows y Mac).",
    rating: 4.4,
    cover: "/images/cover-masquerade.jpg",
    gallery: [],
    platforms: ["Windows", "Mac"],
    access: "public",
    version: "v2.0-ES",
    developer: "Comunidad Juegos Eróticos",
    language: "Español",
    fileSize: "15 MB",
    featured: false,
    links: [{ label: "Parche - MEGA", url: "https://mega.nz/", platform: "Windows", size: "15 MB" }],
    instructions: "1. Descarga el parche.\n2. Copia la carpeta **game** dentro de la carpeta del juego y reemplaza los archivos.\n3. Inicia el juego y selecciona *Español* en Opciones.",
    daysAgo: 7,
    views: 430,
  },
];

type PageSeed = {
  title: string;
  slug: string;
  type: PageType;
  menuSection: MenuSection;
  externalUrl?: string;
  filters?: PageFilters;
  accessLevel?: AccessLevel;
  content?: string;
};

const PAGE_SEED: PageSeed[] = [
  { title: "Inicio", slug: "inicio", type: "link", menuSection: "header", externalUrl: "/" },
  { title: "Juegos", slug: "juegos", type: "link", menuSection: "header", externalUrl: "/juegos" },
  {
    title: "Windows",
    slug: "windows",
    type: "games",
    menuSection: "header",
    filters: { platform: "Windows" },
    content: "Todos los juegos para adultos compatibles con **Windows**.",
  },
  {
    title: "Android",
    slug: "android",
    type: "games",
    menuSection: "header",
    filters: { platform: "Android" },
    content: "Juegos para adultos para tu móvil o tablet **Android** (APK).",
  },
  { title: "Categorías", slug: "categorias", type: "categories", menuSection: "header" },
  { title: "VIP", slug: "vip", type: "vip", menuSection: "header" },
  { title: "Sobre mí", slug: "sobre-mi", type: "about", menuSection: "footer" },
  { title: "Contacto", slug: "contacto", type: "contact", menuSection: "both" },
  {
    title: "Exclusivos para miembros",
    slug: "miembros",
    type: "games",
    menuSection: "footer",
    accessLevel: "registered",
    filters: { access: "registered" },
    content: "Selección de juegos con contenido más explícito, disponible solo para usuarios registrados.",
  },
  {
    title: "Términos y condiciones",
    slug: "terminos",
    type: "content",
    menuSection: "footer",
    content:
      "## Términos de uso\n\nEste sitio está destinado **exclusivamente a personas mayores de 18 años** o de la mayoría de edad legal en su país.\n\n- Todo el contenido publicado es ficticio y todos los personajes representados son mayores de edad.\n- Los juegos pertenecen a sus respectivos creadores. Si eres autor y deseas que retiremos tu contenido, contáctanos.\n- Las suscripciones y donaciones VIP son voluntarias y ayudan a mantener el sitio.\n\n## Privacidad\n\nSolo almacenamos los datos necesarios para tu cuenta (usuario, correo y contraseña cifrada).",
  },
];

const PLAN_SEED = [
  { name: "Donación VIP · 1 mes", price: "5 USD", durationDays: 30, description: "Haz una donación única y obtén acceso VIP durante 30 días.", paymentUrl: "https://www.paypal.com/donate" },
  { name: "Suscripción mensual", price: "9.99 USD / mes", durationDays: 30, description: "Acceso VIP completo con renovación mensual.", paymentUrl: "https://www.patreon.com/" },
  { name: "Suscripción trimestral", price: "24.99 USD", durationDays: 90, description: "Ahorra un 15% con el plan de 3 meses.", paymentUrl: "https://www.paypal.com/" },
  { name: "VIP de por vida", price: "79.99 USD", durationDays: 0, description: "Un único pago y acceso VIP para siempre.", paymentUrl: "https://www.paypal.com/" },
];

/** Credenciales del primer administrador: se pueden definir con variables de entorno. */
function initialAdmin() {
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN.password;
  if (process.env.REQUIRE_SECURE_ADMIN_BOOTSTRAP === "true" && password.trim().length < 16) {
    throw Object.assign(new Error("Define ADMIN_PASSWORD con al menos 16 caracteres para crear el administrador inicial."), {
      code: "ADMIN_PASSWORD_REQUIRED",
    });
  }
  return {
    username: process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN.username,
    email: (process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN.email).toLowerCase(),
    password,
  };
}

const SCHEMA_LOCK_KEY = 74295101;

/** Crea las tablas si faltan (por ejemplo, en una base de datos nueva de Vercel/Neon). */
async function ensureSchema(): Promise<void> {
  const names = sql.join(
    SCHEMA_TABLES.map((t) => sql`${t}`),
    sql`, `,
  );
  const res = await db.execute(
    sql`select count(*)::int as n from information_schema.tables where table_schema = current_schema() and table_name in (${names})`,
  );
  const existing = Number((res.rows[0] as { n?: number } | undefined)?.n ?? 0);
  if (existing >= SCHEMA_TABLES.length) return;
  console.log(`[db] Creando tablas (${existing}/${SCHEMA_TABLES.length} ya existen)...`);
  await db.transaction(async (tx) => {
    // Evita que dos instancias creen las tablas a la vez.
    await tx.execute(sql.raw(`select pg_advisory_xact_lock(${SCHEMA_LOCK_KEY})`));
    for (const statement of SCHEMA_STATEMENTS) {
      await tx.execute(sql.raw(statement));
    }
  });
  console.log("[db] Tablas listas.");
}

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = ensureSchema()
      .then(runSeed)
      .catch((err) => {
        seedPromise = null;
        throw err;
      });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(siteSettings)
      .values({ id: 1, data: DEFAULT_SETTINGS as unknown as Record<string, unknown> })
      .onConflictDoNothing()
      .returning({ id: siteSettings.id });
    if (inserted.length === 0) return;

    const admin = initialAdmin();
    await tx
      .insert(users)
      .values({
        username: admin.username,
        email: admin.email,
        passwordHash: hashPassword(admin.password),
        role: "admin",
      })
      .onConflictDoNothing();

    const cats = await tx
      .insert(categories)
      .values(CATEGORY_SEED.map((c, i) => ({ ...c, slug: slugify(c.name), sortOrder: i })))
      .onConflictDoNothing()
      .returning({ id: categories.id, slug: categories.slug });
    const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

    const types = await tx
      .insert(postTypes)
      .values(TYPE_SEED.map((t, i) => ({ ...t, slug: slugify(t.name), sortOrder: i })))
      .onConflictDoNothing()
      .returning({ id: postTypes.id, slug: postTypes.slug });
    const typeBySlug = new Map(types.map((t) => [t.slug, t.id]));

    for (const p of POST_SEED) {
      const created = new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000);
      const [row] = await tx
        .insert(posts)
        .values({
          title: p.title,
          slug: slugify(p.title),
          postTypeId: typeBySlug.get(p.type) ?? null,
          excerpt: p.excerpt,
          description: p.description,
          rating: p.rating,
          coverImage: p.cover,
          gallery: p.gallery,
          videoUrl: "",
          instructions: p.instructions,
          downloadLinks: p.links,
          platforms: p.platforms,
          accessLevel: p.access,
          version: p.version,
          developer: p.developer,
          language: p.language,
          fileSize: p.fileSize,
          status: "published",
          featured: p.featured,
          views: p.views,
          createdAt: created,
          updatedAt: created,
        })
        .onConflictDoNothing()
        .returning({ id: posts.id });
      if (!row) continue;
      const catIds = p.cats.map((s) => catBySlug.get(s)).filter((x): x is number => typeof x === "number");
      if (catIds.length) {
        await tx.insert(postCategories).values(catIds.map((categoryId) => ({ postId: row.id, categoryId })));
      }
    }

    await tx
      .insert(pages)
      .values(
        PAGE_SEED.map((p, i) => ({
          title: p.title,
          slug: p.slug,
          type: p.type,
          menuSection: p.menuSection,
          menuOrder: i,
          externalUrl: p.externalUrl ?? "",
          filters: p.filters ?? {},
          accessLevel: p.accessLevel ?? "public",
          content: p.content ?? "",
        })),
      )
      .onConflictDoNothing();

    await tx.insert(vipPlans).values(PLAN_SEED.map((p, i) => ({ ...p, sortOrder: i })));
  });
}
