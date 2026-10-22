"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FaPaperPlane, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import {
  changePasswordAction,
  contactAction,
  loginAction,
  registerAction,
  requestVipAction,
  type FormState,
} from "@/app/actions/public";
import { btnPrimary, btnVip, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

function Feedback({ state }: { state: FormState }) {
  if (state.error) {
    return <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</div>;
  }
  if (state.message) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        {state.message}
      </div>
    );
  }
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Feedback state={state} />
      <div>
        <label className={labelCls} htmlFor="identifier">
          Usuario o correo
        </label>
        <input id="identifier" name="identifier" required autoComplete="username" className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className={cn(btnPrimary, "w-full py-3")}>
        <FaSignInAlt /> {pending ? "Entrando..." : "Iniciar sesión"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link href={`/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Feedback state={state} />
      <div>
        <label className={labelCls} htmlFor="username">
          Nombre de usuario
        </label>
        <input id="username" name="username" required minLength={3} maxLength={30} autoComplete="username" className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="email">
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="password">
            Contraseña
          </label>
          <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="confirm">
            Repetir contraseña
          </label>
          <input id="confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" className={inputCls} />
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
        <input type="checkbox" name="adult" required className="mt-0.5 h-4 w-4 accent-brand" />
        <span>Confirmo que soy mayor de 18 años y acepto los términos de uso del sitio.</span>
      </label>
      <button type="submit" disabled={pending} className={cn(btnPrimary, "w-full py-3")}>
        <FaUserPlus /> {pending ? "Creando cuenta..." : "Crear cuenta gratis"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label className={labelCls}>Contraseña actual</label>
        <input name="current" type="password" required autoComplete="current-password" className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nueva contraseña</label>
          <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Repetir nueva contraseña</label>
          <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(contactAction, {});
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nombre</label>
          <input name="name" required maxLength={100} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Correo electrónico</label>
          <input name="email" type="email" required className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Asunto</label>
        <input name="subject" maxLength={200} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Mensaje</label>
        <textarea name="message" required rows={5} className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className={btnPrimary}>
        <FaPaperPlane /> {pending ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}

export function VipRequestForm({ plans }: { plans: { id: number; name: string; price: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestVipAction, {});
  if (state.ok) return <Feedback state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Plan elegido</label>
          <select name="planId" className={inputCls} defaultValue={plans[0]?.id ?? ""}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price}
              </option>
            ))}
            <option value="">Otro / donación libre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Método de pago</label>
          <select name="method" className={inputCls} defaultValue="PayPal">
            {["PayPal", "Patreon", "Ko-fi", "Transferencia bancaria", "Tarjeta", "Criptomonedas", "Otro"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Nº de transacción / referencia *</label>
          <input name="reference" required maxLength={300} placeholder="Ej: 8XK12345AB678901C" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Importe pagado</label>
          <input name="amount" maxLength={100} placeholder="Ej: 9.99 USD" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Mensaje (opcional)</label>
        <textarea name="message" rows={3} className={inputCls} placeholder="Cualquier detalle que ayude a verificar tu pago" />
      </div>
      <button type="submit" disabled={pending} className={btnVip}>
        {pending ? "Enviando..." : "Enviar solicitud VIP"}
      </button>
    </form>
  );
}
