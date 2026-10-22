"use client";

import { useActionState } from "react";
import { FaSave } from "react-icons/fa";
import { changeAdminCredentialsAction } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/public";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";

export function SecurityForm({ username, email }: { username: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changeAdminCredentialsAction, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</div>}
      {state.message && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{state.message}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Usuario del administrador</label>
          <input name="username" defaultValue={username} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Correo del administrador</label>
          <input name="email" type="email" defaultValue={email} required className={inputCls} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nueva contraseña personalizada</label>
          <input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Déjalo vacío para no cambiarla" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Repetir nueva contraseña</label>
          <input name="confirm" type="password" minLength={8} autoComplete="new-password" className={inputCls} />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <label className={labelCls}>Contraseña actual (obligatoria para confirmar)</label>
        <input name="current" type="password" required autoComplete="current-password" className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className={btnPrimary}>
        <FaSave /> {pending ? "Guardando..." : "Guardar cambios de seguridad"}
      </button>
    </form>
  );
}
