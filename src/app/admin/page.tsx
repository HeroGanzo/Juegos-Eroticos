import Link from "next/link";
import { desc, eq, gt, sql } from "drizzle-orm";
import { FaCog, FaCrown, FaEdit, FaExclamationTriangle, FaEye, FaFileAlt, FaGamepad, FaInbox, FaPlus, FaUsers } from "react-icons/fa";
import { AdminTitle, StatCard } from "@/components/admin/AdminUi";
import { AccessBadge } from "@/components/Bits";
import { db } from "@/db";
import { contactMessages, posts, users, vipRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { DEFAULT_ADMIN } from "@/lib/seed";
import { btnPrimary, btnSecondary, cardCls } from "@/lib/ui";
import { cn, formatDate, formatNumber } from "@/lib/utils";

export default async function AdminDashboard() {
  const viewer = await requireAdmin();
  const [[postStats], [userStats], [pending], [unread], recent, me] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
        vip: sql<number>`count(*) filter (where ${posts.accessLevel} = 'vip')::int`,
        views: sql<number>`coalesce(sum(${posts.views}), 0)::int`,
      })
      .from(posts),
    db
      .select({
        total: sql<number>`count(*)::int`,
        vip: sql<number>`count(*) filter (where ${users.vipUntil} > now())::int`,
      })
      .from(users),
    db.select({ n: sql<number>`count(*)::int` }).from(vipRequests).where(eq(vipRequests.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.read, false)),
    db
      .select({ id: posts.id, title: posts.title, slug: posts.slug, accessLevel: posts.accessLevel, status: posts.status, views: posts.views, createdAt: posts.createdAt })
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(6),
    db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, viewer.user.id)),
  ]);
  const recentUsers = await db
    .select({ id: users.id, username: users.username, vipUntil: users.vipUntil, createdAt: users.createdAt })
    .from(users)
    .where(gt(users.id, 0))
    .orderBy(desc(users.createdAt))
    .limit(5);
  const usingDefault = me[0] ? verifyPassword(DEFAULT_ADMIN.password, me[0].hash) : false;

  return (
    <div className="space-y-8">
      <AdminTitle
        title={`Hola, ${viewer.user.username} 👋`}
        subtitle="Gestiona tus publicaciones, páginas, menú, apariencia, usuarios y accesos VIP desde aquí."
        actions={
          <>
            <Link href="/admin/publicaciones/nueva" className={btnPrimary}>
              <FaPlus /> Nueva publicación
            </Link>
            <Link href="/admin/configuracion" className={btnSecondary}>
              <FaCog /> Apariencia
            </Link>
          </>
        }
      />

      {usingDefault && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-400/50 bg-amber-500/10 p-5 text-sm text-amber-100">
          <FaExclamationTriangle className="text-2xl text-amber-300" />
          <p className="flex-1">
            Estás usando la contraseña por defecto (<b>{DEFAULT_ADMIN.password}</b>). Cámbiala por una contraseña personalizada para proteger tu panel.
          </p>
          <Link href="/admin/seguridad" className={btnPrimary}>
            Cambiar contraseña
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Publicaciones" value={postStats.total} icon={<FaGamepad />} />
        <StatCard label="Usuarios" value={userStats.total} icon={<FaUsers />} tone="sky" />
        <StatCard label="VIP activos" value={userStats.vip} icon={<FaCrown />} tone="amber" />
        <StatCard label="Vistas totales" value={formatNumber(postStats.views)} icon={<FaEye />} tone="emerald" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/vip" className={cn(cardCls, "flex items-center gap-4 p-5 hover:border-amber-400/50")}>
          <FaCrown className="text-2xl text-amber-300" />
          <div>
            <p className="text-2xl font-black text-white">{pending.n}</p>
            <p className="text-xs text-zinc-400">Solicitudes VIP pendientes</p>
          </div>
        </Link>
        <Link href="/admin/mensajes" className={cn(cardCls, "flex items-center gap-4 p-5 hover:border-brand/50")}>
          <FaInbox className="text-2xl text-brand" />
          <div>
            <p className="text-2xl font-black text-white">{unread.n}</p>
            <p className="text-xs text-zinc-400">Mensajes sin leer</p>
          </div>
        </Link>
        <Link href="/admin/publicaciones?estado=draft" className={cn(cardCls, "flex items-center gap-4 p-5 hover:border-white/30")}>
          <FaFileAlt className="text-2xl text-zinc-300" />
          <div>
            <p className="text-2xl font-black text-white">{postStats.drafts}</p>
            <p className="text-xs text-zinc-400">Borradores · {postStats.vip} publicaciones VIP</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className={cn(cardCls, "p-5")}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Últimas publicaciones</h2>
            <Link href="/admin/publicaciones" className="text-sm text-brand hover:underline">
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{p.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <AccessBadge level={p.accessLevel} />
                    {p.status === "draft" && <span className="rounded bg-zinc-700 px-1.5 text-zinc-200">Borrador</span>}
                    {formatDate(p.createdAt)} · {formatNumber(p.views)} vistas
                  </p>
                </div>
                <Link href={`/admin/publicaciones/${p.id}`} className="shrink-0 rounded-lg bg-white/5 p-2 text-zinc-300 hover:bg-white/10" title="Editar">
                  <FaEdit />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={cn(cardCls, "p-5")}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Nuevos usuarios</h2>
            <Link href="/admin/usuarios" className="text-sm text-brand hover:underline">
              Gestionar
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="truncate font-semibold text-white">{u.username}</span>
                <span className="flex items-center gap-2 text-xs text-zinc-500">
                  {u.vipUntil && u.vipUntil.getTime() > Date.now() && <FaCrown className="text-amber-300" />}
                  {formatDate(u.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
