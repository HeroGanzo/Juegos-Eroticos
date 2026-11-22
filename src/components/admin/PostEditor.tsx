"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaArrowLeft, FaCrown, FaEye, FaLock, FaPlus, FaSave, FaStar, FaTimes, FaTrash, FaUnlock } from "react-icons/fa";
import { quickCreateCategory, savePost, type PostInput } from "@/app/actions/admin";
import type { AccessLevel } from "@/db/schema";
import { ACCESS_INFO, ACCESS_LEVELS, PLATFORMS } from "@/lib/constants";
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from "@/lib/ui";
import { cn, slugify } from "@/lib/utils";
import { GalleryInput, MediaInput } from "./MediaInput";

type Cat = { id: number; name: string; color: string };
type PType = { id: number; name: string; icon: string };

const ACCESS_ICONS: Record<AccessLevel, React.ReactNode> = {
  public: <FaUnlock />,
  registered: <FaLock />,
  vip: <FaCrown />,
};

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(cardCls, "p-5", className)}>
      <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">{title}</h2>
      {children}
    </section>
  );
}

export function PostEditor({
  initial,
  categories: initialCats,
  postTypes,
  savedNotice,
}: {
  initial: PostInput;
  categories: Cat[];
  postTypes: PType[];
  savedNotice?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<PostInput>(initial);
  const [cats, setCats] = useState<Cat[]>(initialCats);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [otherPlatform, setOtherPlatform] = useState("");
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(savedNotice ?? "");
  const [savedSlug, setSavedSlug] = useState(initial.slug);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => setData((d) => ({ ...d, [key]: value }));

  const toggleIn = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const customPlatforms = data.platforms.filter((p) => !PLATFORMS.includes(p));

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await quickCreateCategory(name);
      if (res.ok) {
        setCats((c) => [...c, { id: res.category.id, name: res.category.name, color: res.category.color }]);
        setData((d) => ({ ...d, categoryIds: [...d.categoryIds, res.category.id] }));
        setNewCat("");
      } else {
        setError(res.error);
      }
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await savePost(data);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!data.id && res.id) {
        router.push(`/admin/publicaciones/${res.id}?ok=creado`);
        return;
      }
      if (res.slug) {
        const finalSlug = res.slug;
        setSavedSlug(finalSlug);
        setData((d) => ({ ...d, slug: finalSlug }));
      }
      setNotice("Cambios guardados correctamente.");
      router.refresh();
    });
  };

  const links = data.downloadLinks;
  const updateLink = (i: number, key: "label" | "url" | "platform" | "size" | "access", value: string) =>
    set(
      "downloadLinks",
      links.map((l, k) => {
        if (k !== i) return l;
        if (key === "access") return { ...l, access: value === "vip" ? "vip" : "common" };
        return { ...l, [key]: value };
      }),
    );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/publicaciones" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <FaArrowLeft /> Volver a publicaciones
        </Link>
        <div className="flex gap-2">
          {data.id && (
            <Link href={`/juego/${savedSlug}`} target="_blank" className={btnSecondary}>
              <FaEye /> Ver
            </Link>
          )}
          <button type="submit" disabled={pending} className={btnPrimary}>
            <FaSave /> {pending ? "Guardando..." : data.id ? "Guardar cambios" : "Publicar"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Información principal">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nombre o título *</label>
                <input
                  value={data.title}
                  required
                  onChange={(e) => {
                    const title = e.target.value;
                    setData((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));
                  }}
                  placeholder="Ej: Neon Nights: Amor en la Ciudad"
                  className={cn(inputCls, "text-base font-semibold")}
                />
              </div>
              <div>
                <label className={labelCls}>URL amigable (slug)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">/juego/</span>
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
              <div>
                <label className={labelCls}>Resumen corto</label>
                <textarea
                  value={data.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  rows={2}
                  maxLength={600}
                  placeholder="Una o dos frases que aparecen en las tarjetas y en la cabecera."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Descripción completa</label>
                <textarea
                  value={data.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={10}
                  placeholder="Describe el juego, la historia, características..."
                  className={cn(inputCls, "font-mono text-[13px] leading-relaxed")}
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  Formato: **negrita**, *cursiva*, ### Título, - lista, 1. lista numerada, [texto](https://enlace)
                </p>
              </div>
            </div>
          </Card>

          <Card title="Imágenes y video">
            <div className="space-y-6">
              <MediaInput label="Imagen de portada" value={data.coverImage} onChange={(v) => set("coverImage", v)} hint="Recomendado: vertical 3:4 (por ejemplo 600×800)." />
              <GalleryInput value={data.gallery} onChange={(v) => set("gallery", v)} />
              <MediaInput
                label="Video (tráiler o gameplay)"
                value={data.videoUrl}
                onChange={(v) => set("videoUrl", v)}
                accept="video/*"
                preview="none"
                placeholder="https://youtube.com/watch?v=... , Vimeo, .mp4 o sube un archivo"
                hint="Admite enlaces de YouTube, Vimeo o archivos .mp4/.webm. También puedes subir un video; en Vercel necesitas activar Vercel Blob (si no, usa YouTube/Vimeo)."
              />
            </div>
          </Card>

          <Card title={`Enlaces de descarga (${links.length})`}>
            <div className="space-y-3">
              {links.map((l, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 md:grid-cols-[1fr_1.6fr_130px_100px_150px_auto]">
                  <input value={l.label} onChange={(e) => updateLink(i, "label", e.target.value)} placeholder="Nombre (MEGA, Drive...)" className={inputCls} />
                  <input value={l.url} onChange={(e) => updateLink(i, "url", e.target.value)} placeholder="https://..." className={inputCls} />
                  <select value={l.platform} onChange={(e) => updateLink(i, "platform", e.target.value)} className={inputCls}>
                    <option value="">Plataforma</option>
                    {[...PLATFORMS, ...customPlatforms].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input value={l.size} onChange={(e) => updateLink(i, "size", e.target.value)} placeholder="Tamaño" className={inputCls} />
                  <select value={l.access ?? "common"} onChange={(e) => updateLink(i, "access", e.target.value)} className={inputCls} title="Quién puede ver este enlace">
                    <option value="common">Común</option>
                    <option value="vip">VIP</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => set("downloadLinks", links.filter((_, k) => k !== i))}
                    className="grid place-items-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 hover:bg-red-500/20"
                    title="Quitar enlace"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("downloadLinks", [...links, { label: "", url: "", platform: data.platforms[0] ?? "", size: data.fileSize, access: "common" }])}
                className={btnSecondary}
              >
                <FaPlus /> Añadir enlace de descarga
              </button>
              <p className="text-xs text-zinc-500">
                <b className="text-zinc-300">Común:</b> lo ve quien puede ver la publicación. <b className="text-zinc-300">VIP:</b> solo usuarios VIP y administradores.
              </p>
            </div>
          </Card>

          <Card title="Instrucciones de instalación">
            <textarea
              value={data.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              rows={8}
              placeholder={"1. Descarga el archivo.\n2. Descomprime con 7-Zip o WinRAR.\n3. Ejecuta el .exe / instala el .apk"}
              className={cn(inputCls, "font-mono text-[13px] leading-relaxed")}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publicación">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Estado</label>
                <select value={data.status} onChange={(e) => set("status", e.target.value === "draft" ? "draft" : "published")} className={inputCls}>
                  <option value="published">Publicado (visible)</option>
                  <option value="draft">Borrador (oculto)</option>
                </select>
              </div>
              <label className="flex items-center gap-3 text-sm text-zinc-200">
                <input type="checkbox" checked={data.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-brand" />
                Destacar en la página de inicio
              </label>
              <button type="submit" disabled={pending} className={cn(btnPrimary, "w-full")}>
                <FaSave /> {pending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </Card>

          <Card title="Tipo de acceso (público)">
            <div className="space-y-2">
              {ACCESS_LEVELS.map((a) => (
                <label
                  key={a}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                    data.accessLevel === a ? "border-brand bg-brand/10" : "border-white/10 hover:border-white/25",
                  )}
                >
                  <input type="radio" name="accessLevel" checked={data.accessLevel === a} onChange={() => set("accessLevel", a)} className="mt-1 accent-brand" />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      {ACCESS_ICONS[a]} {ACCESS_INFO[a].label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-400">{ACCESS_INFO[a].description}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card title="Plataformas">
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <label key={p} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm", data.platforms.includes(p) ? "border-brand bg-brand/10 text-white" : "border-white/10 text-zinc-300")}>
                  <input type="checkbox" checked={data.platforms.includes(p)} onChange={() => set("platforms", toggleIn(data.platforms, p))} className="accent-brand" />
                  {p}
                </label>
              ))}
            </div>
            {customPlatforms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {customPlatforms.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5 rounded-lg bg-brand/20 px-2.5 py-1 text-xs font-semibold text-white">
                    {p}
                    <button type="button" onClick={() => set("platforms", data.platforms.filter((x) => x !== p))} aria-label={`Quitar ${p}`}>
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input value={otherPlatform} onChange={(e) => setOtherPlatform(e.target.value)} placeholder="Otra plataforma" className={inputCls} />
              <button
                type="button"
                className={cn(btnSecondary, "shrink-0 px-3")}
                onClick={() => {
                  const p = otherPlatform.trim();
                  if (p && !data.platforms.includes(p)) set("platforms", [...data.platforms, p]);
                  setOtherPlatform("");
                }}
              >
                <FaPlus />
              </button>
            </div>
          </Card>

          <Card title="Tipo de publicación">
            <select value={data.postTypeId ?? ""} onChange={(e) => set("postTypeId", e.target.value ? Number(e.target.value) : null)} className={inputCls}>
              <option value="">Sin tipo</option>
              {postTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
            <Link href="/admin/tipos" className="mt-2 inline-block text-xs text-brand hover:underline">
              Gestionar tipos de publicación
            </Link>
          </Card>

          <Card title={`Categorías (${data.categoryIds.length})`}>
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {cats.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-200 hover:bg-white/5">
                  <input type="checkbox" checked={data.categoryIds.includes(c.id)} onChange={() => set("categoryIds", toggleIn(data.categoryIds, c.id))} className="accent-brand" />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="Nueva categoría"
                className={inputCls}
              />
              <button type="button" onClick={addCategory} className={cn(btnSecondary, "shrink-0 px-3")} title="Crear categoría">
                <FaPlus />
              </button>
            </div>
          </Card>

          <Card title="Puntuación">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={data.rating}
                onChange={(e) => set("rating", Number(e.target.value))}
                className="flex-1 accent-brand"
              />
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={data.rating}
                onChange={(e) => set("rating", Math.min(5, Math.max(0, Number(e.target.value) || 0)))}
                className={cn(inputCls, "w-20")}
              />
            </div>
            <div className="mt-2 flex gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => set("rating", n)} className={data.rating >= n - 0.25 ? "" : "opacity-25"} aria-label={`${n} estrellas`}>
                  <FaStar />
                </button>
              ))}
            </div>
          </Card>

          <Card title="Ficha técnica">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Desarrollador</label>
                <input value={data.developer} onChange={(e) => set("developer", e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Versión</label>
                  <input value={data.version} onChange={(e) => set("version", e.target.value)} placeholder="v1.0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tamaño</label>
                  <input value={data.fileSize} onChange={(e) => set("fileSize", e.target.value)} placeholder="1.2 GB" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Idioma</label>
                <input value={data.language} onChange={(e) => set("language", e.target.value)} placeholder="Español, Inglés" className={inputCls} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
