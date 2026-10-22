"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaBars,
  FaCog,
  FaCrown,
  FaLock,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import { logoutAction } from "@/app/actions/public";
import { cn } from "@/lib/utils";

export type MenuItem = { label: string; href: string; external: boolean; locked: boolean };
export type HeaderUser = { username: string; isAdmin: boolean; isVip: boolean } | null;

export function SiteHeader({
  siteTitle,
  logoUrl,
  logoHeight,
  items,
  user,
}: {
  siteTitle: string;
  logoUrl: string;
  logoHeight: number;
  items: MenuItem[];
  user: HeaderUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const renderItem = (item: MenuItem, mobile: boolean) => {
    const cls = cn(
      "inline-flex items-center gap-1.5 font-semibold transition",
      mobile ? "w-full rounded-xl px-4 py-3 text-base" : "rounded-full px-3 py-2 text-sm",
      isActive(item.href) ? "bg-brand/20 text-white" : "text-zinc-300 hover:bg-white/10 hover:text-white",
    );
    const content = (
      <>
        {item.label}
        {item.locked && <FaLock className="text-[10px] text-amber-300/80" />}
      </>
    );
    return item.external ? (
      <a key={item.href + item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={close}>
        {content}
      </a>
    ) : (
      <Link key={item.href + item.label} href={item.href} className={cls} onClick={close}>
        {content}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/65 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={close}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteTitle} style={{ height: logoHeight }} className="w-auto max-w-[240px] object-contain" />
          ) : (
            <>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-brand to-purple-700 text-sm font-black text-white shadow-lg shadow-brand/30">
                18+
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{siteTitle}</span>
            </>
          )}
        </Link>

        <nav className="ml-3 hidden items-center gap-0.5 xl:flex">{items.map((i) => renderItem(i, false))}</nav>

        <form action="/juegos" className="ml-auto hidden md:block">
          <div className="relative">
            <input
              name="q"
              placeholder="Buscar juegos o categorías..."
              className="w-56 rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-brand focus:bg-black/60 lg:w-64"
            />
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400" />
          </div>
        </form>

        <div className="hidden items-center gap-2 xl:flex">
          {user ? (
            <>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-3 py-2 text-sm font-semibold text-white hover:bg-brand/25"
                >
                  <FaCog /> Panel
                </Link>
              )}
              <div className="group relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/40 text-xs font-bold uppercase">
                    {user.username.slice(0, 1)}
                  </span>
                  <span className="max-w-[110px] truncate">{user.username}</span>
                  {user.isVip && !user.isAdmin && <FaCrown className="text-amber-300" title="VIP" />}
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-56 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl">
                    <Link href="/cuenta" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-200 hover:bg-white/10">
                      <FaUser /> Mi cuenta
                    </Link>
                    {!user.isVip && (
                      <Link href="/vip" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-amber-200 hover:bg-white/10">
                        <FaCrown /> Hazte VIP
                      </Link>
                    )}
                    <form action={logoutAction}>
                      <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-300 hover:bg-white/10">
                        <FaSignOutAlt /> Cerrar sesión
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10">
                <FaSignInAlt /> Entrar
              </Link>
              <Link
                href="/registro"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:brightness-110"
              >
                <FaUserPlus /> Registrarse
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-xl text-zinc-200 hover:bg-white/10 md:ml-1 xl:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-black/95 xl:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
            <form action="/juegos" className="relative md:hidden" onSubmit={close}>
              <input
                name="q"
                placeholder="Buscar juegos o categorías..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-brand"
              />
              <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400" />
            </form>
            <nav className="grid gap-1">{items.map((i) => renderItem(i, true))}</nav>
            <div className="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
              {user ? (
                <>
                  {user.isAdmin && (
                    <Link href="/admin" onClick={close} className="flex items-center gap-2 rounded-xl bg-brand/20 px-4 py-3 font-semibold text-white">
                      <FaCog /> Panel de control
                    </Link>
                  )}
                  <Link href="/cuenta" onClick={close} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 font-semibold text-white">
                    <FaUser /> Mi cuenta ({user.username}) {user.isVip && !user.isAdmin && <FaCrown className="text-amber-300" />}
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-4 py-3 font-semibold text-red-300">
                      <FaSignOutAlt /> Cerrar sesión
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={close} className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 font-semibold text-white">
                    <FaSignInAlt /> Entrar
                  </Link>
                  <Link href="/registro" onClick={close} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white">
                    <FaUserPlus /> Registrarse gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
