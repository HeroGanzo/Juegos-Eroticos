import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaCrown,
  FaDownload,
  FaEdit,
  FaExternalLinkAlt,
  FaEye,
  FaImages,
  FaInfoCircle,
  FaLock,
  FaTools,
  FaVideo,
} from "react-icons/fa";
import { AccessBadge, Markdown, PlatformChips, PlatformIcon, SectionTitle, Stars } from "@/components/Bits";
import { Gallery } from "@/components/Gallery";
import { LockedPanel } from "@/components/LockedPanel";
import { PostCard } from "@/components/PostCard";
import { canAccess, getViewer } from "@/lib/auth";
import { getPostBySlug, incrementViews, searchPosts } from "@/lib/posts";
import { btnPrimary, btnSecondary, cardCls, containerCls } from "@/lib/ui";
import { cn, formatDate, formatNumber, getVideoEmbed } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Juego no encontrado" };
  return {
    title: post.title,
    description: post.accessLevel === "public" ? post.excerpt || undefined : undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

function Block({ title, icon, children, id }: { title: string; icon: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn(cardCls, "scroll-mt-24 p-5 sm:p-7")}>
      <h2 className="mb-5 flex items-center gap-2.5 text-xl font-black text-white">
        <span className="text-brand">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const [post, viewer] = await Promise.all([getPostBySlug(decodeURIComponent(slug)), getViewer()]);
  if (!post || (post.status !== "published" && !viewer.isAdmin)) notFound();

  const allowed = canAccess(viewer, post.accessLevel);
  if (allowed) await incrementViews(post.id);
  const related = post.categories.length
    ? await searchPosts({ categoryIds: post.categories.map((c) => c.id), excludeId: post.id, perPage: 4, sort: "puntuacion" })
    : null;
  const video = getVideoEmbed(post.videoUrl);
  const isVip = post.accessLevel === "vip";
  const facts = [
    { label: "Desarrollador", value: post.developer },
    { label: "Versión", value: post.version },
    { label: "Idioma", value: post.language },
    { label: "Tamaño", value: post.fileSize },
  ].filter((f) => f.value);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] overflow-hidden">
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" className="h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-(--site-bg)" />
      </div>

      <div className={cn(containerCls, "relative py-8")}>
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white">
            Inicio
          </Link>
          <FaChevronRight className="text-[9px]" />
          <Link href="/juegos" className="hover:text-white">
            Juegos
          </Link>
          <FaChevronRight className="text-[9px]" />
          <span className="truncate text-zinc-200">{post.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <div>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border shadow-2xl",
                isVip ? "border-amber-400/40 shadow-amber-500/20" : "border-white/10 shadow-brand/20",
              )}
            >
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImage} alt={post.title} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="grid aspect-[3/4] place-items-center bg-zinc-900 text-7xl">🎮</div>
              )}
              {!allowed && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/75 py-3 text-sm font-bold backdrop-blur">
                  {isVip ? <FaCrown className="text-amber-300" /> : <FaLock className="text-sky-300" />}
                  <span className={isVip ? "text-amber-200" : "text-sky-200"}>{isVip ? "Contenido VIP" : "Solo registrados"}</span>
                </div>
              )}
            </div>
            {allowed && post.downloadLinks.length > 0 && (
              <a href="#descargas" className={cn(btnPrimary, "mt-4 w-full py-3 text-base")}>
                <FaDownload /> Descargar
              </a>
            )}
            {viewer.isAdmin && (
              <Link href={`/admin/publicaciones/${post.id}`} className={cn(btnSecondary, "mt-3 w-full")}>
                <FaEdit /> Editar publicación
              </Link>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {post.postType && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
                  {post.postType.icon} {post.postType.name}
                </span>
              )}
              <AccessBadge level={post.accessLevel} className="text-[11px]" />
              {post.status === "draft" && (
                <span className="rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs font-bold uppercase text-zinc-200">Borrador</span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
              {allowed && <Stars value={post.rating} className="text-lg" />}
              <span className="inline-flex items-center gap-1.5">
                <FaEye /> {formatNumber(post.views)} vistas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FaCalendarAlt /> {formatDate(post.createdAt)}
              </span>
            </div>
            <PlatformChips platforms={post.platforms} className="mt-5" />
            {post.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/juegos?cat=${c.slug}`}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition hover:brightness-125"
                    style={{ backgroundColor: `${c.color}22`, color: c.color, border: `1px solid ${c.color}55` }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {allowed ? (
              <>
                {post.excerpt && <p className="mt-6 text-lg leading-relaxed text-zinc-200">{post.excerpt}</p>}
                {facts.length > 0 && (
                  <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {facts.map((f) => (
                      <div key={f.label} className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{f.label}</dt>
                        <dd className="mt-1 text-sm font-semibold text-white">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            ) : (
              <div className="mt-8">
                <LockedPanel level={post.accessLevel} loggedIn={!!viewer.user} next={`/juego/${post.slug}`} />
              </div>
            )}
          </div>
        </div>

        {allowed && (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0 space-y-8">
              {post.description && (
                <Block title="Descripción" icon={<FaInfoCircle />}>
                  <Markdown content={post.description} />
                </Block>
              )}
              {video.kind !== "none" && (
                <Block title="Video" icon={<FaVideo />}>
                  {video.kind === "video" ? (
                    <video src={video.src} controls preload="metadata" className="w-full rounded-xl bg-black" />
                  ) : (
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        src={video.src}
                        title={`Video de ${post.title}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </Block>
              )}
              {post.gallery.length > 0 && (
                <Block title={`Galería (${post.gallery.length})`} icon={<FaImages />}>
                  <Gallery images={post.gallery} title={post.title} />
                </Block>
              )}
              {post.instructions && (
                <Block title="Instrucciones de instalación" icon={<FaTools />}>
                  <Markdown content={post.instructions} />
                </Block>
              )}
            </div>

            <aside className="space-y-6">
              <Block title="Enlaces de descarga" icon={<FaDownload />} id="descargas">
                {post.downloadLinks.length ? (
                  <div className="space-y-2.5">
                    {post.downloadLinks.map((l, i) => (
                      <a
                        key={`${l.url}-${i}`}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-brand hover:bg-brand/10"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/20 text-brand">
                            {l.platform ? <PlatformIcon platform={l.platform} /> : <FaDownload />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-white">{l.label}</span>
                            <span className="block text-xs text-zinc-400">{[l.platform, l.size].filter(Boolean).join(" · ")}</span>
                          </span>
                        </span>
                        <FaExternalLinkAlt className="shrink-0 text-xs text-zinc-500 group-hover:text-brand" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Todavía no hay enlaces de descarga.</p>
                )}
              </Block>
              <div className={cn(cardCls, "p-5")}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">Ficha</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    ["Tipo", post.postType ? `${post.postType.icon} ${post.postType.name}` : ""],
                    ["Plataformas", post.platforms.join(", ")],
                    ["Puntuación", `${post.rating.toFixed(1)} / 5`],
                    ["Publicado", formatDate(post.createdAt)],
                    ["Actualizado", formatDate(post.updatedAt)],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0">
                        <dt className="text-zinc-500">{k}</dt>
                        <dd className="text-right font-medium text-zinc-200">{v}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </aside>
          </div>
        )}

        {related && related.items.length > 0 && (
          <section className="mt-16">
            <SectionTitle title="Juegos relacionados" href="/juegos" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.items.map((p) => (
                <PostCard key={p.id} post={p} locked={!canAccess(viewer, p.accessLevel)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
