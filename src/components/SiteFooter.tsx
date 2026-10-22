import Link from "next/link";
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import type { SiteSettings } from "@/lib/constants";
import { containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { SocialLinks } from "./Bits";
import type { MenuItem } from "./SiteHeader";

export function SiteFooter({ settings, items }: { settings: SiteSettings; items: MenuItem[] }) {
  const year = String(new Date().getFullYear());
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/60 backdrop-blur">
      <div className={cn(containerCls, "grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4")}>
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteTitle} className="h-10 w-auto object-contain" />
            ) : (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-brand to-purple-700 text-sm font-black text-white">
                  18+
                </span>
                <span className="text-xl font-extrabold text-white">{settings.siteTitle}</span>
              </>
            )}
          </Link>
          {settings.footerAbout && (
            <p className="mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed text-zinc-400">{settings.footerAbout}</p>
          )}
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
            <span className="font-black">18+</span> Contenido exclusivo para adultos
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Enlaces</h3>
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.href + item.label}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition hover:text-brand">
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className="text-zinc-400 transition hover:text-brand">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link href="/juegos" className="text-zinc-400 transition hover:text-brand">
                Buscar juegos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Síguenos</h3>
          <SocialLinks socials={settings.socials} size="sm" />
          <ul className="mt-5 space-y-2 text-sm text-zinc-400">
            {settings.contactEmail && (
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-brand" />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li className="flex items-center gap-2">
                <FaPhone className="text-brand" /> {settings.contactPhone}
              </li>
            )}
            {settings.contactAddress && (
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-brand" /> {settings.contactAddress}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className={cn(containerCls, "flex flex-col items-center justify-between gap-3 py-6 text-center text-xs text-zinc-500 sm:flex-row sm:text-left")}>
          <p className="whitespace-pre-line">{settings.footerText.replaceAll("{year}", year)}</p>
          <p>Todos los personajes representados son mayores de 18 años.</p>
        </div>
      </div>
    </footer>
  );
}
