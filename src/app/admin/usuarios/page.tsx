import { desc, ilike, or, sql } from "drizzle-orm";
import { FaCrown, FaSearch, FaTrash, FaUserShield } from "react-icons/fa";
import { deleteUserForm, grantVipForm, revokeVipForm, setUserRoleForm } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/AdminUi";
import { ConfirmButton, SubmitButton } from "@/components/ui/Buttons";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { btnSecondary, btnSmall, cardCls, inputCls } from "@/lib/ui";
import { cn, formatDate } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filter = typeof sp.filtro === "string" ? sp.filtro : "";
  const pattern = `%${q}%`;
  const conds = [];
  if (q) conds.push(or(ilike(users.username, pattern), ilike(users.email, pattern)));
  if (filter === "vip") conds.push(sql`${users.vipUntil} > now()`);
  if (filter === "admin") conds.push(sql`${users.role} = 'admin'`);
  const where = conds.length ? sql.join(conds.map((c) => sql`(${c})`), sql` and `) : undefined;
  const list = await db
    .select({ id: users.id, username: users.username, email: users.email, role: users.role, vipUntil: users.vipUntil, createdAt: users.createdAt })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(300);

  return (
    <div className="space-y-6">
      <AdminTitle
        title="Usuarios"
        subtitle="Gestiona los usuarios registrados: activa o quita el acceso VIP manualmente, cambia roles o elimina cuentas."
      />

      <form className={cn(cardCls, "grid gap-3 p-4 sm:grid-cols-[1fr_200px_auto]")}>
        <input name="q" defaultValue={q} placeholder="Buscar por usuario o correo..." className={inputCls} />
        <select name="filtro" defaultValue={filter} className={inputCls}>
          <option value="">Todos</option>
          <option value="vip">Solo VIP activos</option>
          <option value="admin">Solo administradores</option>
        </select>
        <button type="submit" className={btnSecondary}>
          <FaSearch /> Buscar
        </button>
      </form>

      <p className="text-sm text-zinc-400">{list.length} usuarios</p>

      <div className="space-y-3">
        {list.map((u) => {
          const isSelf = u.id === admin.user.id;
          const vipActive = !!u.vipUntil && u.vipUntil.getTime() > Date.now();
          const lifetime = vipActive && u.vipUntil!.getFullYear() >= 2099;
          return (
            <div key={u.id} className={cn(cardCls, "grid gap-4 p-4 lg:grid-cols-[1.2fr_auto_1.6fr_auto] lg:items-center")}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/30 font-black uppercase text-white">{u.username.slice(0, 1)}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-bold text-white">
                    {u.username}
                    {u.role === "admin" && <FaUserShield className="text-brand" title="Administrador" />}
                    {vipActive && <FaCrown className="text-amber-300" title="VIP" />}
                    {isSelf && <span className="text-xs font-normal text-zinc-500">(tú)</span>}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {u.email} · desde {formatDate(u.createdAt)}
                  </p>
                </div>
              </div>

              <form action={setUserRoleForm} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} disabled={isSelf} className={cn(inputCls, "w-auto py-2 text-xs")} aria-label="Rol">
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                {!isSelf && (
                  <SubmitButton className={btnSmall} pendingText="...">
                    Guardar
                  </SubmitButton>
                )}
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", vipActive ? "bg-amber-500/20 text-amber-200" : "bg-white/5 text-zinc-400")}>
                  {vipActive ? (lifetime ? "VIP de por vida" : `VIP hasta ${formatDate(u.vipUntil)}`) : "Sin VIP"}
                </span>
                <form action={grantVipForm} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={u.id} />
                  <input type="number" name="days" min={0} defaultValue={30} className={cn(inputCls, "w-20 py-1.5 text-xs")} title="Días (0 = de por vida)" aria-label="Días de VIP" />
                  <SubmitButton className={cn(btnSmall, "border-amber-400/40 text-amber-200")} pendingText="...">
                    <FaCrown /> {vipActive ? "Ampliar" : "Dar VIP"}
                  </SubmitButton>
                </form>
                {vipActive && (
                  <form action={revokeVipForm}>
                    <input type="hidden" name="id" value={u.id} />
                    <ConfirmButton className={btnSmall} message={`¿Quitar el acceso VIP a ${u.username}?`}>
                      Quitar VIP
                    </ConfirmButton>
                  </form>
                )}
              </div>

              <div className="flex justify-end">
                {!isSelf && (
                  <form action={deleteUserForm}>
                    <input type="hidden" name="id" value={u.id} />
                    <ConfirmButton className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20" message={`¿Eliminar la cuenta de ${u.username}?`}>
                      <FaTrash />
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">Consejo: en «Días» escribe 0 para dar acceso VIP de por vida.</p>
    </div>
  );
}
