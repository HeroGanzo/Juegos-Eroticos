"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaBars,
  FaCrown,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGamepad,
  FaInbox,
  FaLayerGroup,
  FaPalette,
  FaShieldAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTags,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import { logoutAction } from "@/app/actions/public";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; icon: IconType; badge?: "vip" | "mensajes" }[] = [
  { href: "/admin", label: "Escritorio", icon: FaTachometerAlt },
  { href: "/admin/publicaciones", label: "Publicaciones", icon: FaGamepad },
  { href: "/admin/categorias", label: "Categorías", icon: FaTags },
  { href: "/admin/tipos", label: "Tipos de publicación", icon: FaLayerGroup },
  { href: "/admin/paginas", label: "Páginas y menú", icon: FaFileAlt },
  { href: "/admin/configuracion", label: "Apariencia y sitio", icon: FaPalette },
  { href: "/admin/usuarios", label: "Usuarios", icon: FaUsers },
  { href: "/admin/vip", label: "VIP y donaciones", icon: FaCrown, badge: "vip" },
  { href: "/admin/mensajes", label: "Mensajes", icon: FaInbox, badge: "mensajes" },
  { href: "/admin/seguridad", label: "Seguridad", icon: FaShieldAlt },
];

export function AdminNav({
  siteTitle,
  username,
  badges,
}: {
  siteTitle: string;
  username: string;
  badges: { vip: number; mensajes: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur lg:hidden">
        <span className="font-black text-white">Panel · {siteTitle}</span>
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-xl text-white" aria-label="Menú del panel">
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      <aside
        className={cn(
          "z-30 border-r border-white/10 bg-black/70 backdrop-blur-xl lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex h-full flex-col p-4">
          <Link href="/admin" className="mb-6 hidden items-center gap-2.5 px-2 pt-2 lg:flex" onClick={() => setOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-brand to-purple-700 text-sm font-black text-white">
              18+
            </span>
            <span className="min-w-0">
              <span className="block truncate font-black text-white">{siteTitle}</span>
              <span className="block text-xs text-zinc-500">Panel de control</span>
            </span>
          </Link>
          <nav className="space-y-1">
            {LINKS.map((l) => {
              const count = l.badge ? badges[l.badge] : 0;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    isActive(l.href) ? "bg-brand text-white shadow-lg shadow-brand/25" : "text-zinc-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <l.icon className="shrink-0" />
                  <span className="flex-1">{l.label}</span>
                  {count > 0 && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black">{count}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 space-y-1 border-t border-white/10 pt-4 lg:mt-auto">
            <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10">
              <FaExternalLinkAlt /> Ver el sitio
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-300 hover:bg-white/10">
                <FaSignOutAlt /> Salir ({username})
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
