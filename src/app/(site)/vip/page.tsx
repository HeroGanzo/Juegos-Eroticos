import type { Metadata } from "next";
import { FaCrown } from "react-icons/fa";
import { PageHeader } from "@/components/Bits";
import { VipSection } from "@/components/PageSections";
import { getViewer } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { baseMetadata, siteBaseUrl } from "@/lib/seo";
import { containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return baseMetadata({
    title: settings.vipTitle,
    description: settings.vipText,
    path: "/vip",
  });
}

export default async function VipPage() {
  const settings = await getSettings();
  const viewer = await getViewer();
  return (
    <>
      <PageHeader title={settings.vipTitle} icon={<FaCrown />} subtitle="Donaciones y suscripciones para desbloquear el contenido exclusivo." />
      <div className={cn(containerCls, "py-10")}>
        <VipSection settings={settings} viewer={viewer} />
      </div>
    </>
  );
}
