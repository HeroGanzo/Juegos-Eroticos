"use client";

import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

function persistCookie() {
  const secure = window.location.protocol === "https:";
  document.cookie = `age_ok=1; path=/; max-age=31536000; ${secure ? "SameSite=None; Secure" : "SameSite=Lax"}`;
}

export function AgeGate({
  initiallyVerified,
  title,
  text,
  exitUrl,
  siteTitle,
  logoUrl,
}: {
  initiallyVerified: boolean;
  title: string;
  text: string;
  exitUrl: string;
  siteTitle: string;
  logoUrl: string;
}) {
  const [visible, setVisible] = useState(!initiallyVerified);

  useEffect(() => {
    if (!visible) return;
    try {
      if (window.localStorage.getItem("age_ok") === "1") {
        persistCookie();
        setVisible(false);
        return;
      }
    } catch {
      /* ignore */
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  const accept = () => {
    persistCookie();
    try {
      window.localStorage.setItem("age_ok", "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-2xl"
    >
      <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-brand/40 bg-zinc-950/95 p-7 text-center shadow-[0_0_80px_-10px] shadow-brand/50 sm:p-9">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={siteTitle} className="relative mx-auto mb-4 h-12 w-auto object-contain" />
        ) : (
          <p className="relative mb-4 text-sm font-bold uppercase tracking-[0.3em] text-brand">{siteTitle}</p>
        )}
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-brand bg-black text-3xl font-black text-white shadow-lg shadow-brand/40">
          18+
        </div>
        <h2 id="age-gate-title" className="relative mt-6 flex items-center justify-center gap-2 text-2xl font-extrabold text-white">
          <FaExclamationTriangle className="text-amber-400" /> {title}
        </h2>
        <p className="relative mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{text}</p>
        <p className="relative mt-5 text-base font-semibold text-white">¿Eres mayor de 18 años?</p>
        <div className="relative mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={accept}
            className="flex-1 rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:brightness-110"
          >
            Sí, soy mayor de edad — Entrar
          </button>
          <a
            href={exitUrl || "https://www.google.com"}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-zinc-200 transition hover:bg-white/10"
          >
            No, salir
          </a>
        </div>
        <p className="relative mt-5 text-[11px] leading-relaxed text-zinc-500">
          Al entrar declaras que tienes la edad legal para ver contenido para adultos en tu país y aceptas los términos
          de uso del sitio. Todos los personajes representados son mayores de edad.
        </p>
      </div>
    </div>
  );
}
