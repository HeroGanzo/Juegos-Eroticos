import type { Metadata } from "next";
import { FaGamepad } from "react-icons/fa";
import { PageHeader } from "@/components/Bits";
import { GameBrowser, pickParams } from "@/components/GameBrowser";
import { getViewer } from "@/lib/auth";
import { getAllCategories, getAllPostTypes } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buscar juegos" };

export default async function JuegosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
