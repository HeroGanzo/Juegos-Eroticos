import type { Metadata } from "next";
import { FaGamepad } from "react-icons/fa";
import { PageHeader } from "@/components/Bits";
import { GameBrowser, pickParams } from "@/components/GameBrowser";
import { getViewer } from "@/lib/auth";
import { getAllCategories, getAllPostTypes } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { baseMetadata, siteBaseUrl } from "@/lib/seo";
import { containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = pickParams(await searchParams);
  const settings = await getSettings();
  const base = await siteBaseUrl();

  const parts: string[] = [];
  if (sp.q) parts.push(`búsqueda "${sp.q}"`);
  if (sp.cat) parts.push(`categoría "${sp.cat}"`);
  if (sp.plat) parts.push(`plataforma "${sp.plat}"`);
  if (sp.acceso) parts.push(`acceso "${sp.acceso}"`);
  if (sp.orden) parts.push(`orden "${sp.orden}"`);

  const query = Object.entries(sp)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(",") : (v as string);
      return `${encodeURIComponent(k)}=${encodeURIComponent(value)}`;
    })
    .join("&");
  const path = query ? `/juegos?${query}` : "/juegos";

  return baseMetadata({
    title: parts.length ? `Juegos — ${parts.join(", ")}` : "Juegos",
    description: parts.length
      ? `Juegos adultos filtrados por ${parts.join(", ")}. ${settings.tagline}`
      : `Busca y filtra juegos para adultos. ${settings.tagline}`,
    path,
  });
}

export default async function JuegosPage({
  searchParams,
}: Props) {
  const sp = pickParams(await searchParams);
  const settings = await getSettings();
  const [viewer, cats, types] = await Promise.all([getViewer(), getAllCategories(), getAllPostTypes()]);
  return (
    <>
      <PageHeader
        title="Juegos"
        icon={<FaGamepad />}
        subtitle="Busca por nombre o categoría y filtra por plataforma (Windows, Android...), tipo de publicación o nivel de acceso."
      />
      <div className={cn(containerCls, "py-10")}>
        <GameBrowser
          basePath="/juegos"
          params={sp}
          viewer={viewer}
          perPage={settings.postsPerPage}
          categories={cats}
          postTypes={types}
        />
      </div>
    </>
  );
}
