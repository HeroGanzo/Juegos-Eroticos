"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaArrowLeft, FaEye, FaSave } from "react-icons/fa";
import { savePage, type PageInput } from "@/app/actions/admin";
import type { AccessLevel, MenuSection, PageType } from "@/db/schema";
import { ACCESS_INFO, ACCESS_LEVELS, MENU_SECTIONS, PAGE_TYPES, PLATFORMS, SORT_OPTIONS } from "@/lib/constants";
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from "@/lib/ui";
import { cn, slugify } from "@/lib/utils";

export function PageEditor({
  initial,
  categories,
  postTypes,
  savedNotice,
}: {
  initial: PageInput;
  categories: { slug: string; name: string }[];
  postTypes: { slug: string; name: string; icon: string }[];
  savedNotice?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<PageInput>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(savedNotice ?? "");
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof PageInput>(key: K, value: PageInput[K]) => setData((d) => ({ ...d, [key]: value }));
  const setFilter = (key: keyof PageInput["filters"], value: string) =>
    setData((d) => ({ ...d, filters: { ...d.filters, [key]: value || undefined } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await savePage(data);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      if (!data.id && res.id) {
        router.push(`/admin/paginas/${res.id}?ok=creado`);
        return;
      }
      setNotice("Página guardada correctamente.");
      router.refresh();
    });
  };

  const href = data.type === "link" ? data.externalUrl || "/" : `/p/${data.slug}`;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/paginas" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <FaArrowLeft /> Volver a páginas
        </Link>
        <div className="flex gap-2">
          {data.id && (
            <Link href={href} target="_blank" className={btnSecondary}>
              <FaEye /> Ver
            </Link>
          )}
          <button type="submit" disabled={pending} className={btnPrimary}>
            <FaSave /> {pending ? "Guardando..." : "Guardar página"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <section className={cn(cardCls, "space-y-4 p-5")}>
            <div>
              <label className={labelCls}>Título (texto del menú) *</label>
              <input
                value={data.title}
                required
                onChange={(e) => {
                  const title = e.target.value;
                  setData((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));
                }}
                className={cn(inputCls, "text-base font-semibold")}
              />
            </div>
            {data.type !== "link" && (
              <div>
                <label className={labelCls}>URL de la página</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">/p/</span>
                  <input
                    value={data.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </section>

          <section className={cn(cardCls, "p-5")}>
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">Tipo de página</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAGE_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                    data.type === t.value ? "border-brand bg-brand/10" : "border-white/10 hover:border-white/25",
                  )}
                >
                  <input type="radio" checked={data.type === t.value} onChange={() => set("type", t.value as PageType)} className="mt-1 accent-brand" />
                  <span>
                    <span className="block text-sm font-bold text-white">{t.label}</span>
                    <span className="mt-0.5 block text-xs text-zinc-400">{t.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {data.type === "link" && (
            <section className={cn(cardCls, "p-5")}>
              <label className={labelCls}>Dirección del enlace *</label>
              <input value={data.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="/juegos?cat=rpg o https://..." className={inputCls} />
              <p className="mt-1.5 text-xs text-zinc-500">Puede ser interna (empieza por /) o externa (https://...). Las externas se abren en una pestaña nueva.</p>
            </section>
          )}

          {data.type === "games" && (
            <section className={cn(cardCls, "p-5")}>
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">Filtros del listado</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelCls}>Categoría</label>
                  <select value={data.filters.category ?? ""} onChange={(e) => setFilter("category", e.target.value)} className={inputCls}>
                    <option value="">Todas</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Plataforma</label>
                  <select value={data.filters.platform ?? ""} onChange={(e) => setFilter("platform", e.target.value)} className={inputCls}>
                    <option value="">Todas</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tipo de publicación</label>
                  <select value={data.filters.postType ?? ""} onChange={(e) => setFilter("postType", e.target.value)} className={inputCls}>
                    <option value="">Todos</option>
                    {postTypes.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nivel de acceso del contenido</label>
                  <select value={data.filters.access ?? ""} onChange={(e) => setFilter("access", e.target.value)} className={inputCls}>
                    <option value="">Todos</option>
                    {ACCESS_LEVELS.map((a) => (
                      <option key={a} value={a}>
                        {ACCESS_INFO[a].short}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Orden por defecto</label>
                  <select value={data.filters.sort ?? ""} onChange={(e) => setFilter("sort", e.target.value)} className={inputCls}>
                    <option value="">Más recientes</option>
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {data.type !== "link" && (
            <section className={cn(cardCls, "p-5")}>
              <label className={labelCls}>{data.type === "content" ? "Contenido de la página" : "Texto adicional / introducción (opcional)"}</label>
              <textarea
                value={data.content}
                onChange={(e) => set("content", e.target.value)}
                rows={data.type === "content" ? 16 : 6}
                className={cn(inputCls, "font-mono text-[13px] leading-relaxed")}
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                Formato: ## Título, **negrita**, *cursiva*, - lista, [texto](https://enlace), ![imagen](https://url-de-imagen)
              </p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className={cn(cardCls, "space-y-4 p-5")}>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Menú y visibilidad</h2>
            <label className="flex items-center gap-3 text-sm text-zinc-200">
              <input type="checkbox" checked={data.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-brand" />
              Página publicada
            </label>
            <div>
              <label className={labelCls}>Sección del menú</label>
              <select value={data.menuSection} onChange={(e) => set("menuSection", e.target.value as MenuSection)} className={inputCls}>
                {MENU_SECTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Posición en el menú</label>
              <input type="number" value={data.menuOrder} onChange={(e) => set("menuOrder", Number(e.target.value) || 0)} className={inputCls} />
              <p className="mt-1.5 text-xs text-zinc-500">Los números más bajos aparecen primero.</p>
            </div>
          </section>

          {data.type !== "link" && (
            <section className={cn(cardCls, "p-5")}>
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">Tipo de público</h2>
              <div className="space-y-2">
                {ACCESS_LEVELS.map((a) => (
                  <label
                    key={a}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3",
                      data.accessLevel === a ? "border-brand bg-brand/10" : "border-white/10 hover:border-white/25",
                    )}
                  >
                    <input type="radio" checked={data.accessLevel === a} onChange={() => set("accessLevel", a as AccessLevel)} className="mt-1 accent-brand" />
                    <span>
                      <span className="block text-sm font-bold text-white">{ACCESS_INFO[a].label}</span>
                      <span className="block text-xs text-zinc-400">{ACCESS_INFO[a].description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </form>
  );
}
