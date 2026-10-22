"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaSave } from "react-icons/fa";
import { saveSettings } from "@/app/actions/admin";
import { SOCIAL_NETWORKS, type HomeSections, type SiteSettings, type SocialKey } from "@/lib/constants";
import { btnPrimary, cardCls, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { MediaInput } from "./MediaInput";

const TABS = [
  { id: "general", label: "General" },
  { id: "logo", label: "Logo, colores y fondo" },
  { id: "portada", label: "Portada e inicio" },
  { id: "footer", label: "Pie de página" },
  { id: "about", label: "Sobre mí" },
  { id: "contact", label: "Contacto" },
  { id: "social", label: "Redes sociales" },
  { id: "age", label: "Aviso +18" },
  { id: "vip", label: "VIP" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Text({ label, value, onChange, placeholder, hint, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; type?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Area({ label, value, onChange, rows = 4, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={cn(inputCls, "leading-relaxed")} />
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {hint && <span className="block text-xs text-zinc-400">{hint}</span>}
      </span>
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-[42px] w-16 cursor-pointer rounded-xl border border-white/10 bg-black/40 p-1" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      </div>
    </div>
  );
}

export function SettingsEditor({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettings>(initial);
  const [tab, setTab] = useState<TabId>("general");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setHome = (k: keyof HomeSections, v: boolean) => setS((p) => ({ ...p, home: { ...p.home, [k]: v } }));
  const setSocial = (k: SocialKey, v: string) => setS((p) => ({ ...p, socials: { ...p.socials, [k]: v } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await saveSettings(s);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      setNotice("Configuración guardada. Los cambios ya son visibles en el sitio.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-2 backdrop-blur lg:top-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn("rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm", tab === t.id ? "bg-brand text-white" : "text-zinc-300 hover:bg-white/10")}
          >
            {t.label}
          </button>
        ))}
        <button type="submit" disabled={pending} className={cn(btnPrimary, "ml-auto")}>
          <FaSave /> {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      <div className={cn(cardCls, "space-y-5 p-5 sm:p-7")}>
        {tab === "general" && (
          <>
            <Text label="Título de la página" value={s.siteTitle} onChange={(v) => set("siteTitle", v)} hint="Aparece en la cabecera, la pestaña del navegador y el pie de página." />
            <Text label="Eslogan / descripción" value={s.tagline} onChange={(v) => set("tagline", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Juegos por página" type="number" value={String(s.postsPerPage)} onChange={(v) => set("postsPerPage", Number(v) || 12)} />
            </div>
            <Toggle label="Permitir registro de nuevos usuarios" checked={s.allowRegistration} onChange={(v) => set("allowRegistration", v)} />
          </>
        )}

        {tab === "logo" && (
          <>
            <MediaInput label="Logo" value={s.logoUrl} onChange={(v) => set("logoUrl", v)} hint="Si lo dejas vacío se muestra el título con un icono 18+." />
            <Text label="Altura del logo (px)" type="number" value={String(s.logoHeight)} onChange={(v) => set("logoHeight", Number(v) || 40)} />
            <MediaInput label="Favicon (icono de la pestaña)" value={s.faviconUrl} onChange={(v) => set("faviconUrl", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Color principal" value={s.primaryColor} onChange={(v) => set("primaryColor", v)} />
              <ColorField label="Color de fondo" value={s.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
            </div>
            <MediaInput label="Imagen de fondo" value={s.backgroundImage} onChange={(v) => set("backgroundImage", v)} hint="Se muestra fija detrás de todo el sitio." />
            <div>
              <label className={labelCls}>Oscurecer imagen de fondo: {s.backgroundOverlay}%</label>
              <input type="range" min={0} max={100} value={s.backgroundOverlay} onChange={(e) => set("backgroundOverlay", Number(e.target.value))} className="w-full accent-brand" />
            </div>
          </>
        )}

        {tab === "portada" && (
          <>
            <Toggle label="Mostrar portada (banner principal)" checked={s.heroEnabled} onChange={(v) => set("heroEnabled", v)} />
            <MediaInput label="Imagen de portada" value={s.heroImage} onChange={(v) => set("heroImage", v)} hint="Recomendado: horizontal, 1920×900 o similar." />
            <Text label="Título de la portada" value={s.heroTitle} onChange={(v) => set("heroTitle", v)} />
            <Area label="Subtítulo de la portada" value={s.heroSubtitle} onChange={(v) => set("heroSubtitle", v)} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Texto del botón" value={s.heroButtonText} onChange={(v) => set("heroButtonText", v)} />
              <Text label="Enlace del botón" value={s.heroButtonLink} onChange={(v) => set("heroButtonLink", v)} placeholder="/juegos" />
            </div>
            <h3 className="pt-2 text-sm font-black uppercase tracking-wider text-white">Secciones de la página de inicio</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Accesos Windows / Android" checked={s.home.showPlatforms} onChange={(v) => setHome("showPlatforms", v)} />
              <Toggle label="Juegos destacados" checked={s.home.showFeatured} onChange={(v) => setHome("showFeatured", v)} />
              <Toggle label="Categorías" checked={s.home.showCategories} onChange={(v) => setHome("showCategories", v)} />
              <Toggle label="Últimas publicaciones" checked={s.home.showLatest} onChange={(v) => setHome("showLatest", v)} />
              <Toggle label="Zona VIP" checked={s.home.showVip} onChange={(v) => setHome("showVip", v)} />
              <Toggle label="Niveles de acceso" checked={s.home.showAccessTiers} onChange={(v) => setHome("showAccessTiers", v)} />
            </div>
          </>
        )}

        {tab === "footer" && (
          <>
            <Area label="Texto del pie de página (copyright)" value={s.footerText} onChange={(v) => set("footerText", v)} rows={3} hint="Usa {year} para mostrar el año actual automáticamente." />
            <Area label="Descripción en el pie de página" value={s.footerAbout} onChange={(v) => set("footerAbout", v)} rows={3} />
            <p className="text-xs text-zinc-500">Los enlaces del pie se gestionan en «Páginas y menú» (sección del menú: Pie de página).</p>
          </>
        )}

        {tab === "about" && (
          <>
            <Text label="Título" value={s.aboutTitle} onChange={(v) => set("aboutTitle", v)} />
            <MediaInput label="Foto o imagen" value={s.aboutImage} onChange={(v) => set("aboutImage", v)} />
            <Area label="Texto «Sobre mí»" value={s.aboutText} onChange={(v) => set("aboutText", v)} rows={10} hint="Admite formato: **negrita**, *cursiva*, - listas, [enlaces](https://...)" />
          </>
        )}

        {tab === "contact" && (
          <>
            <Text label="Título" value={s.contactTitle} onChange={(v) => set("contactTitle", v)} />
            <Area label="Texto de contacto" value={s.contactText} onChange={(v) => set("contactText", v)} rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Correo electrónico" value={s.contactEmail} onChange={(v) => set("contactEmail", v)} />
              <Text label="Teléfono" value={s.contactPhone} onChange={(v) => set("contactPhone", v)} />
            </div>
            <Text label="Dirección / ubicación" value={s.contactAddress} onChange={(v) => set("contactAddress", v)} />
            <Toggle label="Mostrar formulario de contacto" checked={s.contactFormEnabled} onChange={(v) => set("contactFormEnabled", v)} hint="Los mensajes llegan a «Mensajes» en este panel." />
          </>
        )}

        {tab === "social" && (
          <>
            <p className="text-sm text-zinc-400">Deja vacío cualquier campo para ocultar esa red social. Se muestran en el pie de página, «Sobre mí» y «Contacto».</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_NETWORKS.map((n) => (
                <Text key={n.key} label={n.label} value={s.socials[n.key] ?? ""} onChange={(v) => setSocial(n.key, v)} placeholder={n.placeholder} />
              ))}
            </div>
          </>
        )}

        {tab === "age" && (
          <>
            <Toggle label="Mostrar advertencia de mayoría de edad en la primera visita" checked={s.ageGateEnabled} onChange={(v) => set("ageGateEnabled", v)} />
            <Text label="Título de la advertencia" value={s.ageGateTitle} onChange={(v) => set("ageGateTitle", v)} />
            <Area label="Texto de la advertencia" value={s.ageGateText} onChange={(v) => set("ageGateText", v)} rows={5} />
            <Text label="Página de salida (si responde que NO es mayor de edad)" value={s.ageGateExitUrl} onChange={(v) => set("ageGateExitUrl", v)} />
          </>
        )}

        {tab === "vip" && (
          <>
            <Text label="Título de la página VIP" value={s.vipTitle} onChange={(v) => set("vipTitle", v)} />
            <Area label="Texto de presentación VIP" value={s.vipText} onChange={(v) => set("vipText", v)} rows={3} />
            <Area label="Ventajas VIP (una por línea)" value={s.vipBenefits} onChange={(v) => set("vipBenefits", v)} rows={6} />
            <Area label="Instrucciones de pago / donación" value={s.paymentInstructions} onChange={(v) => set("paymentInstructions", v)} rows={6} />
            <p className="text-xs text-zinc-500">Los planes y precios se gestionan en «VIP y donaciones».</p>
          </>
        )}
      </div>
    </form>
  );
}
