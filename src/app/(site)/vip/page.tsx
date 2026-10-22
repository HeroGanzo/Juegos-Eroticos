import type { Metadata } from "next";
import { FaCrown } from "react-icons/fa";
import { PageHeader } from "@/components/Bits";
import { VipSection } from "@/components/PageSections";
import { getViewer } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Acceso VIP" };

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
