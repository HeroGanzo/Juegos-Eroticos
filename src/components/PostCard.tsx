import Link from "next/link";
import { FaCrown, FaEye, FaFire, FaLock } from "react-icons/fa";
import type { PostListItem } from "@/lib/posts";
import { cn, formatNumber } from "@/lib/utils";
import { AccessBadge, PlatformIcon, Stars } from "./Bits";

export function PostCard({ post, locked }: { post: PostListItem; locked: boolean }) {
  const isVip = post.accessLevel === "vip";
  return (
    <Link
      href={`/juego/${post.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white/[0.03] transition duration-300 hover:-translate-y-1",
        isVip
          ? "border-amber-400/25 hover:border-amber-400/70 hover:shadow-[0_12px_40px_-12px] hover:shadow-amber-500/40"
          : "border-white/10 hover:border-brand/60 hover:shadow-[0_12px_40px_-12px] hover:shadow-brand/50",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-5xl">🎮</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black via-black/40 to-transparent" />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {post.accessLevel !== "public" && <AccessBadge level={post.accessLevel} />}
          {post.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand/50 bg-brand/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
              <FaFire className="text-[9px]" /> Top
            </span>
          )}
        </div>

        <div className="absolute right-2 top-2 flex gap-1">
          {post.platforms.slice(0, 4).map((p) => (
            <span key={p} className="grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-sm text-white backdrop-blur" title={p}>
              <PlatformIcon platform={p} />
            </span>
          ))}
        </div>

        {locked && (
          <div className="absolute inset-0 grid place-items-center">
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-full border-2 bg-black/70 text-xl backdrop-blur transition group-hover:scale-110",
                isVip ? "border-amber-400 text-amber-300" : "border-sky-400 text-sky-300",
              )}
            >
              {isVip ? <FaCrown /> : <FaLock />}
            </span>
          </div>
        )}

        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
          <Stars value={post.rating} className="text-xs" />
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300">
            <FaEye /> {formatNumber(post.views)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {post.postType && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {post.postType.icon} {post.postType.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-bold leading-snug text-white transition group-hover:text-brand">{post.title}</h3>
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.categories.slice(0, 3).map((c) => (
              <span
                key={c.id}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: `${c.color}26`, color: c.color }}
              >
                {c.name}
              </span>
            ))}
          </div>
        )}
        {locked ? (
          <p className={cn("mt-auto flex items-center gap-1.5 text-xs font-semibold", isVip ? "text-amber-300" : "text-sky-300")}>
            {isVip ? <FaCrown /> : <FaLock />} {isVip ? "Solo para miembros VIP" : "Regístrate para verlo"}
          </p>
        ) : (
          post.excerpt && <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}
