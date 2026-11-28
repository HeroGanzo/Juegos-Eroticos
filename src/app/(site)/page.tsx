import type { Metadata } from "next";
import Link from "next/link";
import { FaAndroid, FaArrowRight, FaCheck, FaClock, FaCrown, FaFire, FaLock, FaSearch, FaTags, FaUnlock, FaUserPlus, FaWindows } from "react-icons/fa";
import { SectionTitle } from "@/components/Bits";
import { PostCard } from "@/components/PostCard";
import { canAccess, getViewer } from "@/lib/auth";
import { getCategoriesWithCounts, searchPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { baseMetadata, organizationJsonLd, webSiteJsonLd, jsonLd, siteBaseUrl } from "@/lib/seo";
import { btnPrimary, btnSecondary, btnVip, containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return baseMetadata({
    title: settings.siteTitle,
    description: settings.tagline,
    path: "/",
    image: settings.heroImage || undefined,
  });
}

export default async function HomePage() {
  const settings = await getSettings();
  const base = await siteBaseUrl();
  const viewer = await getViewer();
  const h = settings.home;
  const schema = jsonLd({
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(settings.socials, base), webSiteJsonLd(base)],
  });
  const [featured, latest, vip, cats] = await Promise.all([
    h.showFeatured ? searchPosts({ featured: true, perPage: 8, sort: "recientes" }) : null,
    h.showLatest ? searchPosts({ perPage: 8, sort: "recientes" }) : null,
    h.showVip ? searchPosts({ access: "vip", perPage: 4, sort: "puntuacion" }) : null,
    h.showCategories ? getCategoriesWithCounts() : null,
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schema }}
        key="schema-home"
      />
      {settings.heroEnabled && (
        <section className="relative overflow-hidden border-b border-white/5">
          {settings.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black/95 via-black/70 to-black/20" />
          <div className="absolute inset-0 bg-linear-to-t from-(--site-bg) via-transparent to-transparent" />
          <div className={cn(containerCls, "relative py-20 sm:py-28 lg:py-36")}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Solo para adultos · +18
            </span>
            <h1 className="text-glow mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {settings.heroTitle}
            </h1>
            {settings.heroSubtitle && (
              <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-relaxed text-zinc-200 sm:text-lg">{settings.heroSubtitle}</p>
            )}
            <form action="/juegos" className="mt-8 flex max-w-xl gap-2 rounded-2xl border border-white/15 bg-black/50 p-2 backdrop-blur">
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  name="q"
                  placeholder="Busca por nombre o categoría..."
                  className="h-full w-full rounded-xl bg-transparent py-3 pl-10 pr-3 text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <button type="submit" className={btnPrimary}>
                Buscar
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              {settings.heroButtonText && (
                <Link href={settings.heroButtonLink || "/juegos"} className={btnSecondary}>
                  {settings.heroButtonText} <FaArrowRight className="text-xs" />
                </Link>
              )}
              {!viewer.user && (
                <Link href="/registro" className={btnSecondary}>
                  <FaUserPlus /> Crear cuenta gratis
                </Link>
              )}
              {!viewer.isVip && (
                <Link href="/vip" className={btnVip}>
                  <FaCrown /> Hazte VIP
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <div className={cn(containerCls, "space-y-20 py-14")}>
        {h.showPlatforms && (
          <section className="grid gap-5 md:grid-cols-2">
            <Link
              href="/juegos?plat=Windows"
              className="group relative overflow-hidden rounded-3xl border border-sky-400/30 bg-linear-to-br from-sky-500/25 via-blue-900/20 to-transparent p-7 transition hover:-translate-y-1 hover:border-sky-400/70"
            >
              <FaWindows className="absolute -bottom-6 -right-4 text-[9rem] text-sky-400/15 transition group-hover:scale-110" />
              <FaWindows className="text-4xl text-sky-300" />
              <h2 className="mt-4 text-2xl font-black text-white">Juegos para Windows</h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-300">Novelas visuales, RPG y simuladores para tu PC.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-300">
                Ver juegos <FaArrowRight className="transition group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/juegos?plat=Android"
              className="group relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-linear-to-br from-emerald-500/25 via-green-900/20 to-transparent p-7 transition hover:-translate-y-1 hover:border-emerald-400/70"
            >
              <FaAndroid className="absolute -bottom-6 -right-4 text-[9rem] text-emerald-400/15 transition group-hover:scale-110" />
              <FaAndroid className="text-4xl text-emerald-300" />
              <h2 className="mt-4 text-2xl font-black text-white">Juegos para Android</h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-300">APK listos para instalar en tu móvil o tablet.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
                Ver juegos <FaArrowRight className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          </section>
        )}

        {featured && featured.items.length > 0 && (
          <section>
            <SectionTitle title="Destacados" subtitle="Los juegos más recomendados" icon={<FaFire />} href="/juegos?orden=populares" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.items.map((p) => (
                <PostCard key={p.id} post={p} locked={!canAccess(viewer, p.accessLevel)} />
              ))}
            </div>
          </section>
        )}

        {cats && cats.length > 0 && (
          <section>
            <SectionTitle title="Categorías" subtitle="Explora por género" icon={<FaTags />} href="/juegos" linkText="Buscar" />
            <div className="flex flex-wrap gap-2.5">
              {cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/juegos?cat=${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ borderColor: `${c.color}66`, backgroundColor: `${c.color}1a`, color: c.color }}
                >
                  {c.name}
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-zinc-200">{c.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {latest && latest.items.length > 0 && (
          <section>
            <SectionTitle title="Últimas publicaciones" subtitle="Lo más nuevo del sitio" icon={<FaClock />} href="/juegos" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {latest.items.map((p) => (
                <PostCard key={p.id} post={p} locked={!canAccess(viewer, p.accessLevel)} />
              ))}
            </div>
          </section>
        )}

        {vip && vip.items.length > 0 && (
          <section className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-linear-to-br from-amber-500/10 via-black/40 to-brand/10 p-6 sm:p-8">
            <SectionTitle
              title="Zona VIP"
              subtitle={viewer.isVip ? "Disfruta de tu contenido exclusivo" : "Contenido exclusivo para donadores y suscriptores"}
              icon={<FaCrown />}
              href="/juegos?acceso=vip"
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {vip.items.map((p) => (
                <PostCard key={p.id} post={p} locked={!canAccess(viewer, p.accessLevel)} />
              ))}
            </div>
            {!viewer.isVip && (
              <div className="mt-6 text-center">
                <Link href="/vip" className={btnVip}>
                  <FaCrown /> Desbloquear todo con VIP
                </Link>
              </div>
            )}
          </section>
        )}

        {h.showAccessTiers && (
          <section>
            <SectionTitle title="Niveles de acceso" subtitle="Elige cuánto quieres ver" />
            <div className="grid gap-5 md:grid-cols-3">
              <Tier
                icon={<FaUnlock />}
                tone="emerald"
                title="Visitante +18"
                active={viewer.rank === 0}
                items={["Portadas de todos los juegos", "Contenido público completo", "Búsqueda por nombre y categoría"]}
              />
              <Tier
                icon={<FaLock />}
                tone="sky"
                title="Usuario registrado"
                active={viewer.rank === 1}
                items={["Todo lo del visitante", "Contenido más explícito", "Galerías, videos y descargas exclusivas"]}
                cta={!viewer.user ? { href: "/registro", label: "Registrarme gratis" } : undefined}
              />
              <Tier
                icon={<FaCrown />}
                tone="amber"
                title="Miembro VIP"
                active={viewer.rank >= 2}
                items={["Todo lo anterior", "Contenido especial VIP", "Versiones completas y actualizaciones anticipadas"]}
                cta={!viewer.isVip ? { href: "/vip", label: "Hazte VIP" } : undefined}
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Tier({
  icon,
  tone,
  title,
  items,
  active,
  cta,
}: {
  icon: React.ReactNode;
  tone: "emerald" | "sky" | "amber";
  title: string;
  items: string[];
  active: boolean;
  cta?: { href: string; label: string };
}) {
  const tones = {
    emerald: "border-emerald-400/30 from-emerald-500/15 text-emerald-300",
    sky: "border-sky-400/30 from-sky-500/15 text-sky-300",
    amber: "border-amber-400/40 from-amber-500/15 text-amber-300",
  };
  return (
    <div className={cn("relative flex flex-col rounded-2xl border bg-linear-to-b to-transparent p-6", tones[tone], active && "ring-2 ring-brand")}>
      {active && (
        <span className="absolute right-4 top-4 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">Tu nivel</span>
      )}
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-3 text-xl font-black text-white">{title}</h3>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-300">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <FaCheck className="mt-1 shrink-0 text-xs" /> {i}
          </li>
        ))}
      </ul>
      {cta && (
        <Link href={cta.href} className={cn(tone === "amber" ? btnVip : btnPrimary, "mt-6")}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}
