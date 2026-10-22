import Link from "next/link";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FaAndroid,
  FaApple,
  FaChevronRight,
  FaCrown,
  FaDiscord,
  FaFacebookF,
  FaGamepad,
  FaGlobe,
  FaInstagram,
  FaLinux,
  FaLock,
  FaPatreon,
  FaPinterestP,
  FaRedditAlien,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTelegramPlane,
  FaTiktok,
  FaTwitch,
  FaUnlock,
  FaWhatsapp,
  FaWindows,
  FaYoutube,
} from "react-icons/fa";
import { FaBluesky, FaThreads, FaXTwitter } from "react-icons/fa6";
import type { AccessLevel } from "@/db/schema";
import { ACCESS_INFO, SOCIAL_NETWORKS, socialUrl, type SocialKey } from "@/lib/constants";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

const PLATFORM_ICONS: Record<string, IconType> = {
  windows: FaWindows,
  android: FaAndroid,
  mac: FaApple,
  macos: FaApple,
  ios: FaApple,
  linux: FaLinux,
  web: FaGlobe,
  navegador: FaGlobe,
};

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] ?? FaGamepad;
  return <Icon className={className} title={platform} aria-label={platform} />;
}

export function PlatformChips({ platforms, className }: { platforms: string[]; className?: string }) {
  if (!platforms.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {platforms.map((p) => (
        <span
          key={p}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-200"
        >
          <PlatformIcon platform={p} /> {p}
        </span>
      ))}
    </div>
  );
}

export function Stars({ value, className, showValue = true }: { value: number; className?: string; showValue?: boolean }) {
  const stars: ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-amber-400", className)} title={`${value.toFixed(1)} / 5`}>
      {stars}
      {showValue && <span className="ml-1.5 text-xs font-semibold text-zinc-200">{value.toFixed(1)}</span>}
    </span>
  );
}

export function AccessBadge({ level, className }: { level: AccessLevel; className?: string }) {
  const info = ACCESS_INFO[level];
  const Icon = level === "vip" ? FaCrown : level === "registered" ? FaLock : FaUnlock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur",
        info.badge,
        className,
      )}
    >
      <Icon className="text-[9px]" /> {info.short}
    </span>
  );
}

const SOCIAL_ICONS: Record<SocialKey, IconType> = {
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  telegram: FaTelegramPlane,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  discord: FaDiscord,
  reddit: FaRedditAlien,
  patreon: FaPatreon,
  twitch: FaTwitch,
  pinterest: FaPinterestP,
  threads: FaThreads,
  bluesky: FaBluesky,
  website: FaGlobe,
};

const SOCIAL_HOVER: Record<SocialKey, string> = {
  whatsapp: "hover:bg-[#25D366] hover:border-[#25D366]",
  facebook: "hover:bg-[#1877F2] hover:border-[#1877F2]",
  instagram: "hover:bg-[#E4405F] hover:border-[#E4405F]",
  telegram: "hover:bg-[#26A5E4] hover:border-[#26A5E4]",
  twitter: "hover:bg-black hover:border-white/40",
  youtube: "hover:bg-[#FF0000] hover:border-[#FF0000]",
  tiktok: "hover:bg-[#ff0050] hover:border-[#ff0050]",
  discord: "hover:bg-[#5865F2] hover:border-[#5865F2]",
  reddit: "hover:bg-[#FF4500] hover:border-[#FF4500]",
  patreon: "hover:bg-[#FF424D] hover:border-[#FF424D]",
  twitch: "hover:bg-[#9146FF] hover:border-[#9146FF]",
  pinterest: "hover:bg-[#E60023] hover:border-[#E60023]",
  threads: "hover:bg-black hover:border-white/40",
  bluesky: "hover:bg-[#0085ff] hover:border-[#0085ff]",
  website: "hover:bg-brand hover:border-brand",
};

export function SocialLinks({
  socials,
  size = "md",
  className,
  withLabels = false,
}: {
  socials: Record<string, string>;
  size?: "sm" | "md" | "lg";
  className?: string;
  withLabels?: boolean;
}) {
  const entries = SOCIAL_NETWORKS.map((n) => ({ ...n, url: socialUrl(n.key, socials[n.key] ?? "") })).filter(
    (e) => e.url,
  );
  if (!entries.length) return null;
  const sizeCls = size === "sm" ? "h-8 w-8 text-sm" : size === "lg" ? "h-12 w-12 text-xl" : "h-10 w-10 text-base";
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {entries.map((e) => {
        const Icon = SOCIAL_ICONS[e.key];
        return withLabels ? (
          <a
            key={e.key}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:-translate-y-0.5 hover:text-white",
              SOCIAL_HOVER[e.key],
            )}
          >
            <Icon /> {e.label}
          </a>
        ) : (
          <a
            key={e.key}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            title={e.label}
            aria-label={e.label}
            className={cn(
              "grid place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:-translate-y-0.5 hover:text-white",
              sizeCls,
              SOCIAL_HOVER[e.key],
            )}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const html = renderMarkdown(content);
  if (!html) return null;
  return <div className={cn("prose-content", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SectionTitle({
  title,
  subtitle,
  href,
  linkText = "Ver todo",
  icon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {icon && <span className="text-brand">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand transition hover:gap-2"
        >
          {linkText} <FaChevronRight className="text-xs" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-linear-to-b from-brand/15 to-transparent">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {icon && <span className="text-brand">{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-3xl text-zinc-300">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "success" | "error"; children: ReactNode }) {
  const cls =
    kind === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : kind === "error"
        ? "border-red-500/40 bg-red-500/10 text-red-200"
        : "border-sky-500/40 bg-sky-500/10 text-sky-200";
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", cls)}>{children}</div>;
}
