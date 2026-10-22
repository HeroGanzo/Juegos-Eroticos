import { asc, desc, eq, sql } from "drizzle-orm";
import { FaCheck, FaCrown, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { deleteVipPlanForm, reviewVipRequestForm, saveVipPlanForm } from "@/app/actions/admin";
import { AdminTitle, StatCard } from "@/components/admin/AdminUi";
import { RequestStatus } from "@/components/PageSections";
import { ConfirmButton, SubmitButton } from "@/components/ui/Buttons";
import { db } from "@/db";
import { users, vipPlans, vipRequests } from "@/db/schema";
import { btnPrimary, btnSecondary, btnSmall, cardCls, inputCls, labelCls } from "@/lib/ui";
import { cn, formatDate } from "@/lib/utils";

export default async function AdminVipPage() {
  const [requests, plans, [stats]] = await Promise.all([
    db
      .select({
        id: vipRequests.id,
        status: vipRequests.status,
        method: vipRequests.method,
        reference: vipRequests.reference,
        amount: vipRequests.amount,
        message: vipRequests.message,
        createdAt: vipRequests.createdAt,
        reviewedAt: vipRequests.reviewedAt,
        username: users.username,
        email: users.email,
        planName: vipPlans.name,
        planDays: vipPlans.durationDays,
      })
      .from(vipRequests)
      .innerJoin(users, eq(vipRequests.userId, users.id))
      .leftJoin(vipPlans, eq(vipRequests.planId, vipPlans.id))
      .orderBy(sql`case when ${vipRequests.status} = 'pending' then 0 else 1 end`, desc(vipRequests.createdAt))
      .limit(100),
    db.select().from(vipPlans).orderBy(asc(vipPlans.sortOrder), asc(vipPlans.id)),
    db
      .select({
        active: sql<number>`(select count(*)::int from users where vip_until > now())`,
        pending: sql<number>`(select count(*)::int from vip_requests where status = 'pending')`,
        approved: sql<number>`(select count(*)::int from vip_requests where status = 'approved')`,
      })
      .from(sql`(select 1) as t`),
  ]);
  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-10">
      <AdminTitle
        title="VIP y donaciones"
        subtitle="Revisa las solicitudes de acceso VIP (donaciones o suscripciones), aprueba o rechaza y gestiona los planes. También puedes dar VIP manualmente desde «Usuarios»."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="VIP activos" value={stats?.active ?? 0} icon={<FaCrown />} tone="amber" />
        <StatCard label="Pendientes" value={stats?.pending ?? 0} icon={<FaCrown />} />
        <StatCard label="Aprobadas" value={stats?.approved ?? 0} icon={<FaCheck />} tone="emerald" />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-black text-white">Solicitudes pendientes ({pending.length})</h2>
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-white">
                    {r.username} <span className="font-normal text-zinc-500">· {r.email}</span>
                  </p>
                  <p className="text-zinc-300">
                    Plan: <b>{r.planName ?? "Donación libre"}</b>
                    {r.planName ? ` (${r.planDays ? `${r.planDays} días` : "de por vida"})` : ""} · Método: <b>{r.method || "—"}</b> · Importe: <b>{r.amount || "—"}</b>
                  </p>
                  <p className="text-zinc-300">
                    Referencia: <code className="rounded bg-black/40 px-1.5 py-0.5 text-amber-200">{r.reference}</code>
                  </p>
                  {r.message && <p className="whitespace-pre-line text-zinc-400">“{r.message}”</p>}
                  <p className="text-xs text-zinc-500">Enviada el {formatDate(r.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <form action={reviewVipRequestForm} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <div>
                      <label className={labelCls}>Días</label>
                      <input
                        type="number"
                        name="days"
                        min={0}
                        placeholder={r.planName ? String(r.planDays) : "30"}
                        className={cn(inputCls, "w-24 py-2")}
                        title="Déjalo vacío para usar la duración del plan. 0 = de por vida"
                      />
                    </div>
                    <SubmitButton className={cn(btnPrimary, "bg-emerald-600 shadow-emerald-600/20")} pendingText="...">
                      <FaCheck /> Aprobar
                    </SubmitButton>
                  </form>
                  <form action={reviewVipRequestForm}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <ConfirmButton className={btnSecondary} message="¿Rechazar esta solicitud?">
                      <FaTimes /> Rechazar
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {!pending.length && <p className={cn(cardCls, "p-6 text-center text-sm text-zinc-400")}>No hay solicitudes pendientes.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-black text-white">Planes VIP</h2>
        <form action={saveVipPlanForm} className={cn(cardCls, "grid items-end gap-3 p-5 md:grid-cols-6")}>
          <h3 className="text-sm font-black uppercase tracking-wider text-white md:col-span-6">Nuevo plan</h3>
          <div className="md:col-span-2">
            <label className={labelCls}>Nombre</label>
            <input name="name" required placeholder="Ej: Suscripción mensual" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Precio</label>
            <input name="price" placeholder="9.99 USD" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Días (0 = siempre)</label>
            <input type="number" name="durationDays" min={0} defaultValue={30} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Enlace de pago (PayPal, Patreon, Ko-fi...)</label>
            <input name="paymentUrl" placeholder="https://..." className={inputCls} />
          </div>
          <div className="md:col-span-4">
            <label className={labelCls}>Descripción</label>
            <input name="description" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Orden</label>
            <input type="number" name="sortOrder" defaultValue={plans.length} className={inputCls} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" name="active" defaultChecked className="accent-brand" /> Activo
            </label>
            <SubmitButton className={btnPrimary} pendingText="...">
              <FaPlus /> Añadir
            </SubmitButton>
          </div>
        </form>

        <div className="mt-4 space-y-3">
          {plans.map((p) => (
            <div key={p.id} className={cn(cardCls, "p-4")}>
              <form action={saveVipPlanForm} className="grid items-end gap-3 md:grid-cols-6">
                <input type="hidden" name="id" value={p.id} />
                <div className="md:col-span-2">
                  <label className={labelCls}>Nombre</label>
                  <input name="name" defaultValue={p.name} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Precio</label>
                  <input name="price" defaultValue={p.price} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Días (0 = siempre)</label>
                  <input type="number" name="durationDays" min={0} defaultValue={p.durationDays} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Enlace de pago</label>
                  <input name="paymentUrl" defaultValue={p.paymentUrl} className={inputCls} />
                </div>
                <div className="md:col-span-4">
                  <label className={labelCls}>Descripción</label>
                  <input name="description" defaultValue={p.description} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Orden</label>
                  <input type="number" name="sortOrder" defaultValue={p.sortOrder} className={inputCls} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" name="active" defaultChecked={p.active} className="accent-brand" /> Activo
                  </label>
                  <SubmitButton className={btnSmall} pendingText="...">
                    <FaSave /> Guardar
                  </SubmitButton>
                </div>
              </form>
              <form action={deleteVipPlanForm} className="mt-2 text-right">
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10" message={`¿Eliminar el plan "${p.name}"?`}>
                  <FaTrash /> Eliminar plan
                </ConfirmButton>
              </form>
            </div>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-black text-white">Historial</h2>
          <div className={cn(cardCls, "divide-y divide-white/5")}>
            {history.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span className="text-zinc-300">
                  <b className="text-white">{r.username}</b> · {r.planName ?? "Donación libre"} · {r.method} · ref. {r.reference}
                </span>
                <span className="flex items-center gap-3 text-xs text-zinc-500">
                  {formatDate(r.reviewedAt ?? r.createdAt)} <RequestStatus status={r.status} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
