import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FaCog, FaCrown, FaSignOutAlt, FaUser } from "react-icons/fa";
import { logoutAction } from "@/app/actions/public";
import { Notice, PageHeader } from "@/components/Bits";
import { ChangePasswordForm } from "@/components/forms/PublicForms";
import { RequestStatus } from "@/components/PageSections";
import { db } from "@/db";
import { vipPlans, vipRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { btnPrimary, btnSecondary, btnVip, cardCls, containerCls } from "@/lib/ui";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireUser("/cuenta");
  const sp = await searchParams;
  const user = viewer.user;
  const requests = await db
    .select({
      id: vipRequests.id,
      status: vipRequests.status,
      createdAt: vipRequests.createdAt,
      method: vipRequests.method,
      reference: vipRequests.reference,
      planName: vipPlans.name,
    })
    .from(vipRequests)
    .leftJoin(vipPlans, eq(vipRequests.planId, vipPlans.id))
    .where(eq(vipRequests.userId, user.id))
    .orderBy(desc(vipRequests.createdAt));

  const lifetime = !!user.vipUntil && user.vipUntil.getFullYear() >= 2099;
  const level = viewer.isAdmin ? "Administrador" : viewer.isVip ? "VIP" : "Usuario registrado";

  return (
    <>
      <PageHeader title="Mi cuenta" icon={<FaUser />} subtitle={`Hola, ${user.username}. Gestiona tu cuenta y tu acceso VIP.`} />
      <div className={cn(containerCls, "space-y-8 py-10")}>
        {sp.bienvenido && <Notice kind="success">¡Bienvenido/a! Tu cuenta se ha creado correctamente. Ya puedes ver el contenido para registrados.</Notice>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={cn(cardCls, "p-6")}>
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/30 text-xl font-black uppercase text-white">
                {user.username.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{user.username}</p>
                <p className="truncate text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Nivel de acceso</dt>
                <dd className="font-semibold text-white">{level}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Miembro desde</dt>
                <dd className="text-zinc-200">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {viewer.isAdmin && (
                <Link href="/admin" className={btnPrimary}>
                  <FaCog /> Panel de control
                </Link>
              )}
              <form action={logoutAction}>
                <button type="submit" className={btnSecondary}>
                  <FaSignOutAlt /> Cerrar sesión
                </button>
              </form>
            </div>
          </div>

          <div className={cn("rounded-2xl border p-6 lg:col-span-2", viewer.isVip ? "border-amber-400/50 bg-amber-500/10" : "border-white/10 bg-white/[0.04]")}>
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <FaCrown className="text-amber-300" /> Estado VIP
            </h2>
            {viewer.isAdmin ? (
              <p className="mt-3 text-zinc-300">Como administrador tienes acceso completo a todo el contenido.</p>
            ) : viewer.isVip ? (
              <p className="mt-3 text-amber-100">
                ¡Eres VIP! {lifetime ? "Tu acceso es de por vida." : `Tu acceso está activo hasta el ${formatDate(user.vipUntil)}.`}
              </p>
            ) : (
              <>
                <p className="mt-3 text-zinc-300">
                  Aún no eres VIP. Haz una donación o suscríbete para desbloquear todo el contenido exclusivo.
                </p>
                <Link href="/vip" className={cn(btnVip, "mt-5")}>
                  <FaCrown /> Hazte VIP
                </Link>
              </>
            )}
            {requests.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">Mis solicitudes VIP</h3>
                <ul className="space-y-2">
                  {requests.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-2.5 text-sm">
                      <span className="text-zinc-300">
                        {r.planName ?? "Donación libre"} · {r.method} · ref. {r.reference} · {formatDate(r.createdAt)}
                      </span>
                      <RequestStatus status={r.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={cn(cardCls, "max-w-2xl p-6")}>
          <h2 className="mb-5 text-xl font-black text-white">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
