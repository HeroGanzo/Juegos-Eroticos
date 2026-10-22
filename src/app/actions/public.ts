"use server";

import { and, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contactMessages, users, vipPlans, vipRequests } from "@/db/schema";
import { createSession, destroySession, getViewer } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ensureSeeded } from "@/lib/seed";
import { getSettings } from "@/lib/settings";
import { int, safeNext, str } from "@/lib/utils";

export type FormState = { ok?: boolean; error?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const identifier = str(formData.get("identifier"), 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(str(formData.get("next"), 500));
  if (!identifier || !password) return { error: "Introduce tu usuario o correo y la contraseña." };
  await ensureSeeded();
  const rows = await db
    .select()
    .from(users)
    .where(or(sql`lower(${users.email}) = ${identifier}`, sql`lower(${users.username}) = ${identifier}`))
    .limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }
  await createSession(user.id);
  redirect(next || (user.role === "admin" ? "/admin" : "/"));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const settings = await getSettings();
  if (!settings.allowRegistration) return { error: "El registro de nuevos usuarios está desactivado." };
  const username = str(formData.get("username"), 30);
  const email = str(formData.get("email"), 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const adult = formData.get("adult") === "on";
  const next = safeNext(str(formData.get("next"), 500));
  if (!USERNAME_RE.test(username)) {
    return { error: "El usuario debe tener entre 3 y 30 caracteres (letras, números, punto, guion o guion bajo)." };
  }
  if (!EMAIL_RE.test(email)) return { error: "Introduce un correo electrónico válido." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };
  if (!adult) return { error: "Debes confirmar que eres mayor de 18 años." };
  const exists = await db
    .select({ id: users.id })
    .from(users)
    .where(or(sql`lower(${users.email}) = ${email}`, sql`lower(${users.username}) = ${username.toLowerCase()}`))
    .limit(1);
  if (exists.length) return { error: "Ese nombre de usuario o correo ya está registrado." };
  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash: hashPassword(password), role: "user" })
    .returning({ id: users.id });
  await createSession(user.id);
  redirect(next || "/cuenta?bienvenido=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer.user) return { error: "Debes iniciar sesión." };
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 6) return { error: "La nueva contraseña debe tener al menos 6 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas nuevas no coinciden." };
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, viewer.user.id));
  if (!row || !verifyPassword(current, row.hash)) return { error: "La contraseña actual no es correcta." };
  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, viewer.user.id));
  return { ok: true, message: "Contraseña actualizada correctamente." };
}

export async function requestVipAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer.user) return { error: "Debes iniciar sesión para solicitar el acceso VIP." };
  const planId = int(formData.get("planId"), 0);
  const method = str(formData.get("method"), 100);
  const reference = str(formData.get("reference"), 300);
  const amount = str(formData.get("amount"), 100);
  const message = str(formData.get("message"), 2000);
  if (!reference) return { error: "Indica el número de transacción o la referencia del pago/donación." };
  let validPlanId: number | null = null;
  if (planId) {
    const rows = await db.select({ id: vipPlans.id }).from(vipPlans).where(eq(vipPlans.id, planId)).limit(1);
    validPlanId = rows[0]?.id ?? null;
  }
  const pending = await db
    .select({ id: vipRequests.id })
    .from(vipRequests)
    .where(and(eq(vipRequests.userId, viewer.user.id), eq(vipRequests.status, "pending")));
  if (pending.length >= 3) {
    return { error: "Ya tienes varias solicitudes pendientes. Espera a que un administrador las revise." };
  }
  await db.insert(vipRequests).values({
    userId: viewer.user.id,
    planId: validPlanId,
    method,
    reference,
    amount,
    message,
  });
  revalidatePath("/cuenta");
  return {
    ok: true,
    message: "¡Solicitud enviada! Un administrador verificará tu pago y activará tu acceso VIP muy pronto.",
  };
}

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (str(formData.get("website"))) return { ok: true, message: "Mensaje enviado." };
  const name = str(formData.get("name"), 100);
  const email = str(formData.get("email"), 200);
  const subject = str(formData.get("subject"), 200);
  const message = str(formData.get("message"), 5000);
  if (!name || !EMAIL_RE.test(email) || message.length < 5) {
    return { error: "Escribe tu nombre, un correo válido y un mensaje." };
  }
  await db.insert(contactMessages).values({ name, email, subject, message });
  return { ok: true, message: "¡Gracias! Tu mensaje ha sido enviado. Te responderemos lo antes posible." };
}
