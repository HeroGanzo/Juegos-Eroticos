import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FaCrown, FaEnvelope, FaFileAlt, FaGamepad, FaListAlt, FaTags, FaUser } from "react-icons/fa";
import { Markdown, Notice, PageHeader } from "@/components/Bits";
import { GameBrowser, pickParams } from "@/components/GameBrowser";
import { LockedPanel } from "@/components/LockedPanel";
import { AboutSection, CategoriesGrid, ContactSection, PlannedGamesList, VipSection } from "@/components/PageSections";
import { canAccess, getViewer } from "@/lib/auth";
import { getAllCategories, getAllPostTypes, getPageBySlug, getPlannedGamesForPage } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { baseMetadata, siteBaseUrl, jsonLd, breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo";
import { cardCls, containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function plainExcerpt(html: string, max = 160): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(decodeURIComponent(slug));
  const settings = await getSettings();
  const base = await siteBaseUrl();
  const description = page
    ? page.content
      ? plainExcerpt(page.content)
      : `${page.title} — ${settings.siteTitle}`
    : settings.tagline;
  return baseMetadata({
    title: page?.title ?? "Página no encontrada",
    description,
    path: page ? `/p/${page.slug}` : "/p",
  });
}

const ICONS = {
  content: <FaFileAlt />,
  games: <FaGamepad />,
  wishlist: <FaListAlt />,
  categories: <FaTags />,
  about: <FaUser />,
  contact: <FaEnvelope />,
  vip: <FaCrown />,
  link: <FaFileAlt />,
};

export default async function DynamicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = pickParams(await searchParams);
  const settings = await getSettings();
  const [page, viewer] = await Promise.all([getPageBySlug(decodeURIComponent(slug)), getViewer()]);
  if (!page || (!page.published && !viewer.isAdmin)) notFound();
  if (page.type === "link") redirect(page.externalUrl || "/");

  const base = await siteBaseUrl();
  const pageUrl = `${base}/p/${page.slug}`;
  const schema = jsonLd({
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(settings.socials, base),
      breadcrumbJsonLd([
        { name: "Inicio", url: base },
        { name: page.title, url: pageUrl },
      ]),
    ],
  });

  const allowed = canAccess(viewer, page.accessLevel);

  let body: React.ReactNode = null;
  if (allowed) {
    switch (page.type) {
      case "games": {
        const [cats, types] = await Promise.all([getAllCategories(), getAllPostTypes()]);
        body = (
          <div className="space-y-6">
            {page.content && <Markdown content={page.content} />}
            <GameBrowser
              basePath={`/p/${page.slug}`}
              params={sp}
              fixed={page.filters}
              viewer={viewer}
              perPage={settings.postsPerPage}
              categories={cats}
              postTypes={types}
            />
          </div>
        );
        break;
      }
      case "wishlist": {
        const planned = await getPlannedGamesForPage(page.id);
        body = <PlannedGamesList items={planned} intro={page.content} />;
        break;
      }
      case "categories":
        body = (
          <div className="space-y-6">
            {page.content && <Markdown content={page.content} />}
            <CategoriesGrid />
          </div>
        );
        break;
      case "about":
        body = <AboutSection settings={settings} extra={page.content} />;
        break;
      case "contact":
        body = <ContactSection settings={settings} extra={page.content} />;
        break;
      case "vip":
        body = <VipSection settings={settings} viewer={viewer} intro={page.content} />;
        break;
      default:
        body = (
          <div className={cn(cardCls, "p-6 sm:p-10")}>
            {page.content ? <Markdown content={page.content} /> : <p className="text-zinc-400">Esta página aún no tiene contenido.</p>}
          </div>
        );
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} key="schema-page" />
      <PageHeader title={page.title} icon={ICONS[page.type]} />
      <div className={cn(containerCls, "space-y-6 py-10")}>
        {!page.published && <Notice>Esta página es un borrador: solo los administradores pueden verla.</Notice>}
        {allowed ? body : <LockedPanel level={page.accessLevel} loggedIn={!!viewer.user} next={`/p/${page.slug}`} what="esta sección" />}
      </div>
    </>
  );
}
