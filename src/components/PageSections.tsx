import Link from "next/link";
import type { ReactNode } from "react";
import { asc, desc, eq } from "drizzle-orm";
import { FaCheck, FaCrown, FaEnvelope, FaExternalLinkAlt, FaMapMarkerAlt, FaPhone, FaSignInAlt, FaUserPlus, FaWhatsapp } from "react-icons/fa";
import { db } from "@/db";
import { vipPlans, vipRequests } from "@/db/schema";
import { canAccess, type Viewer } from "@/lib/auth";
import { socialUrl, type SiteSettings } from "@/lib/constants";
import { getCategoriesWithCounts, searchPosts } from "@/lib/posts";
import { btnPrimary, btnSecondary, btnVip, cardCls } from "@/lib/ui";
import { cn, formatDate } from "@/lib/utils";
import { Markdown, SectionTitle, SocialLinks } from "./Bits";
import { ContactForm, VipRequestForm } from "./forms/PublicForms";
import { PostCard } from "./PostCard";

export async function CategoriesGrid() {
  const cats = await getCategoriesWithCounts();
  if (!cats.length) return <p className="text-zinc-400">Todavía no hay categorías.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cats.map((c) => (
        <Link
          key={c.id}
          href={`/juegos?cat=${c.slug}`}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/25"
        >
          <div
            className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60"
            style={{ backgroundColor: c.color }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">{c.name}</h3>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${c.color}33`, color: c.color }}>
              {c.count} {c.count === 1 ? "juego" : "juegos"}
            </span>
          </div>
          {c.description && <p className="relative mt-2 text-sm text-zinc-400">{c.description}</p>}
        </Link>
      ))}
    </div>
  );
}

export function AboutSection({ settings, extra }: { settings: SiteSettings; extra?: string }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      <div className="space-y-5">
        {settings.aboutImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.aboutImage} alt={settings.aboutTitle} className="aspect-square w-full rounded-3xl border border-white/10 object-cover shadow-2xl" />
        ) : (
          <div className="grid aspect-square w-full place-items-center rounded-3xl border border-white/10 bg-linear-to-br from-brand/40 to-purple-900/40 text-8xl">
            💋
          </div>
        )}
        <SocialLinks socials={settings.socials} />
      </div>
      <div className={cn(cardCls, "p-6 sm:p-10")}>
        <h2 className="mb-5 text-3xl font-black text-white">{settings.aboutTitle}</h2>
        <Markdown content={settings.aboutText} />
        {extra && <Markdown content={extra} className="mt-6" />}
      </div>
    </div>
  );
}

export function ContactSection({ settings, extra }: { settings: SiteSettings; extra?: string }) {
  const wa = socialUrl("whatsapp", settings.socials.whatsapp);
  const tg = socialUrl("telegram", settings.socials.telegram);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-6">
        <div className={cn(cardCls, "p-6 sm:p-8")}>
          <h2 className="mb-4 text-2xl font-black text-white">{settings.contactTitle}</h2>
          <Markdown content={settings.contactText} />
          {extra && <Markdown content={extra} className="mt-4" />}
          <ul className="mt-6 space-y-3 text-sm">
            {settings.contactEmail && (
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200 hover:border-brand">
                  <FaEnvelope className="text-brand" /> {settings.contactEmail}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200 hover:border-[#25D366]">
                  <FaWhatsapp className="text-[#25D366]" /> Escríbeme por WhatsApp
                </a>
              </li>
            )}
            {tg && (
              <li>
                <a href={tg} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200 hover:border-[#26A5E4]">
                  <FaExternalLinkAlt className="text-[#26A5E4]" /> Canal / chat de Telegram
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200">
                <FaPhone className="text-brand" /> {settings.contactPhone}
              </li>
            )}
            {settings.contactAddress && (
              <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200">
                <FaMapMarkerAlt className="text-brand" /> {settings.contactAddress}
              </li>
            )}
          </ul>
        </div>
        <div className={cn(cardCls, "p-6")}>
          <h3 className="mb-4 font-bold text-white">Redes sociales</h3>
          <SocialLinks socials={settings.socials} withLabels />
        </div>
      </div>
      {settings.contactFormEnabled && (
        <div className={cn(cardCls, "h-fit p-6 sm:p-8")}>
          <h2 className="mb-5 text-2xl font-black text-white">Envíame un mensaje</h2>
          <ContactForm />
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-500/20 text-amber-200" },
  approved: { label: "Aprobada", cls: "bg-emerald-500/20 text-emerald-200" },
  rejected: { label: "Rechazada", cls: "bg-red-500/20 text-red-200" },
};

export function RequestStatus({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.pending;
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", s.cls)}>{s.label}</span>;
}

export async function VipSection({ settings, viewer, intro }: { settings: SiteSettings; viewer: Viewer; intro?: string }) {
  const plans = await db
    .select()
    .from(vipPlans)
    .where(eq(vipPlans.active, true))
    .orderBy(asc(vipPlans.sortOrder), asc(vipPlans.id));
  const myRequests = viewer.user
    ? await db
        .select({
          id: vipRequests.id,
          status: vipRequests.status,
          createdAt: vipRequests.createdAt,
          reference: vipRequests.reference,
          planName: vipPlans.name,
        })
        .from(vipRequests)
        .leftJoin(vipPlans, eq(vipRequests.planId, vipPlans.id))
        .where(eq(vipRequests.userId, viewer.user.id))
        .orderBy(desc(vipRequests.createdAt))
        .limit(5)
    : [];
  const preview = await searchPosts({ access: "vip", perPage: 4, sort: "puntuacion" });
  const benefits = settings.vipBenefits
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const vipUntil = viewer.user?.vipUntil ?? null;
  const lifetime = !!vipUntil && vipUntil.getFullYear() >= 2099;

  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-linear-to-br from-amber-500/15 via-black/40 to-brand/20 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-200">
              <FaCrown /> Acceso VIP
            </p>
            <p className="mt-4 text-lg leading-relaxed text-zinc-100">{settings.vipText}</p>
            {intro && <Markdown content={intro} className="mt-4" />}
          </div>
          {benefits.length > 0 && (
            <ul className="space-y-2.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-zinc-100">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-[10px] text-black">
                    <FaCheck />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {viewer.isAdmin ? (
        <StatusCard tone="admin">Como administrador tienes acceso total a todo el contenido, incluido el VIP.</StatusCard>
      ) : viewer.isVip ? (
        <StatusCard tone="vip">
          ¡Eres miembro VIP! {lifetime ? "Tu acceso es de por vida." : `Tu acceso está activo hasta el ${formatDate(vipUntil)}.`} Puedes
          renovarlo o ampliarlo cuando quieras.
        </StatusCard>
      ) : null}

      {plans.length > 0 && (
        <section>
          <SectionTitle title="Planes y donaciones" subtitle="Elige cómo quieres apoyar el sitio" icon={<FaCrown />} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6",
                  i === 1 ? "border-amber-400/60 bg-amber-500/10 shadow-xl shadow-amber-500/10" : "border-white/10 bg-white/[0.04]",
                )}
              >
                {i === 1 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-black uppercase text-black">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="mt-3 text-3xl font-black text-amber-300">{p.price}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {p.durationDays > 0 ? `${p.durationDays} días de acceso VIP` : "Acceso VIP de por vida"}
                </p>
                {p.description && <p className="mt-4 flex-1 text-sm text-zinc-300">{p.description}</p>}
                {p.paymentUrl ? (
                  <a href={p.paymentUrl} target="_blank" rel="noopener noreferrer" className={cn(btnVip, "mt-6 w-full")}>
                    Pagar / Donar <FaExternalLinkAlt className="text-xs" />
                  </a>
                ) : (
                  <span className={cn(btnSecondary, "mt-6 w-full")}>Consultar</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <div className={cn(cardCls, "p-6 sm:p-8")}>
          <h2 className="mb-4 text-xl font-black text-white">¿Cómo activar mi VIP?</h2>
          <Markdown content={settings.paymentInstructions} />
        </div>
        <div className={cn(cardCls, "p-6 sm:p-8")}>
          <h2 className="mb-4 text-xl font-black text-white">Solicitar activación VIP</h2>
          {viewer.user ? (
            <VipRequestForm plans={plans.map((p) => ({ id: p.id, name: p.name, price: p.price }))} />
          ) : (
            <div className="space-y-4 text-sm text-zinc-300">
              <p>Para solicitar el acceso VIP primero necesitas una cuenta (es gratis).</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/registro?next=/vip" className={btnPrimary}>
                  <FaUserPlus /> Crear cuenta
                </Link>
                <Link href="/login?next=/vip" className={btnSecondary}>
                  <FaSignInAlt /> Iniciar sesión
                </Link>
              </div>
            </div>
          )}
          {myRequests.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">Mis solicitudes</h3>
              <ul className="space-y-2">
                {myRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm">
                    <span className="truncate text-zinc-300">
                      {r.planName ?? "Donación libre"} · {formatDate(r.createdAt)}
                    </span>
                    <RequestStatus status={r.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {preview.items.length > 0 && (
        <section>
          <SectionTitle title="Lo que desbloqueas" subtitle="Algunos de los contenidos exclusivos VIP" href="/juegos?acceso=vip" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {preview.items.map((p) => (
              <PostCard key={p.id} post={p} locked={!canAccess(viewer, p.accessLevel)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusCard({ tone, children }: { tone: "admin" | "vip"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-5 text-sm",
        tone === "vip" ? "border-amber-400/50 bg-amber-500/10 text-amber-100" : "border-brand/50 bg-brand/10 text-zinc-100",
      )}
    >
      <FaCrown className="shrink-0 text-2xl text-amber-300" />
      <p>{children}</p>
    </div>
  );
}

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className={cn(cardCls, "p-6 sm:p-8")}>
        <h1 className="text-3xl font-black text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {aside && <div>{aside}</div>}
    </div>
  );
}
