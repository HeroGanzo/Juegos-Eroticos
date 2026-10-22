import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, type MenuItem } from "@/components/SiteHeader";
import { canAccess, getViewer } from "@/lib/auth";
import { isExternalUrl, pageHref } from "@/lib/constants";
import { getMenuPages } from "@/lib/posts";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const [viewer, menu] = await Promise.all([getViewer(), getMenuPages()]);

  const toItem = (p: (typeof menu)[number]): MenuItem => {
    const href = pageHref(p);
    return { label: p.title, href, external: isExternalUrl(href), locked: !canAccess(viewer, p.accessLevel) };
  };
  const headerItems = menu.filter((p) => p.menuSection === "header" || p.menuSection === "both").map(toItem);
  const footerItems = menu.filter((p) => p.menuSection === "footer" || p.menuSection === "both").map(toItem);

  return (
    <>
      <SiteHeader
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
        logoHeight={settings.logoHeight}
        items={headerItems}
        user={viewer.user ? { username: viewer.user.username, isAdmin: viewer.isAdmin, isVip: viewer.isVip } : null}
      />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter settings={settings} items={footerItems} />
    </>
  );
}
