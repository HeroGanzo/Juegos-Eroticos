import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { AgeGate } from "@/components/AgeGate";
import { SetupScreen } from "@/components/SetupScreen";
import { getViewer } from "@/lib/auth";
import { getDbStatus } from "@/lib/db-status";
import { getSettings } from "@/lib/settings";
import { baseMetadata, siteBaseUrl, organizationJsonLd, webSiteJsonLd, jsonLd } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function metadataBase(): Promise<URL> {
  return new URL(await siteBaseUrl());
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const baseMeta = await baseMetadata({ title: s.siteTitle, description: s.tagline, path: "/" });
  return {
    ...baseMeta,
    title: { default: `${s.siteTitle} — ${s.tagline}`, template: `%s | ${s.siteTitle}` },
    description: s.tagline,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : [{ url: "/icon.svg" }],
    other: {
      RATING: "RTA-5042-1996-1400-1577-RTA",
      "theme-color": s.primaryColor ?? "#ec4899",
    },
    openGraph: {
      ...baseMeta.openGraph,
      images: s.heroImage ? [{ url: s.heroImage, width: 1200, height: 630, alt: s.siteTitle }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const dbStatus = await getDbStatus();
  if (!dbStatus.ok) {
    return (
      <html lang="es">
        <body className="min-h-screen font-sans text-zinc-100 antialiased">
          <SetupScreen status={dbStatus} />
        </body>
      </html>
    );
  }

  const settings = await getSettings();
  const viewer = await getViewer();
  const cookieStore = await cookies();
  const ageOk = cookieStore.get("age_ok")?.value === "1";
  const style = { "--brand": settings.primaryColor, "--site-bg": settings.backgroundColor } as CSSProperties;
  const bg = settings.backgroundImage.replace(/["\\\n\r]/g, "");

  return (
    <html lang="es" style={style}>
      <body className="min-h-screen font-sans text-zinc-100 antialiased selection:bg-brand/40">
        {bg && (
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url("${bg}")` }}>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: settings.backgroundColor, opacity: settings.backgroundOverlay / 100 }}
            />
          </div>
        )}
        {children}
        {settings.ageGateEnabled && !viewer.user && (
          <AgeGate
            initiallyVerified={ageOk}
            title={settings.ageGateTitle}
            text={settings.ageGateText}
            exitUrl={settings.ageGateExitUrl}
            siteTitle={settings.siteTitle}
            logoUrl={settings.logoUrl}
          />
        )}
      </body>
    </html>
  );
}
