import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FaCrown, FaLock, FaUnlock } from "react-icons/fa";
import { LoginForm } from "@/components/forms/PublicForms";
import { AuthShell } from "@/components/PageSections";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : "");
  const viewer = await getViewer();
  if (viewer.user) redirect(next || (viewer.isAdmin ? "/admin" : "/cuenta"));

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta para ver el contenido para miembros y VIP."
      aside={
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">Tres niveles de acceso</h2>
          <div className="flex gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <FaUnlock className="mt-1 shrink-0 text-xl text-emerald-300" />
            <p className="text-sm text-zinc-300">
              <b className="text-white">Visitante +18:</b> contenido público y portadas de todos los juegos.
            </p>
          </div>
          <div className="flex gap-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
            <FaLock className="mt-1 shrink-0 text-xl text-sky-300" />
            <p className="text-sm text-zinc-300">
              <b className="text-white">Registrado:</b> contenido más explícito, galerías y descargas para miembros.
            </p>
          </div>
          <div className="flex gap-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
            <FaCrown className="mt-1 shrink-0 text-xl text-amber-300" />
            <p className="text-sm text-zinc-300">
              <b className="text-white">VIP:</b> contenido especial para donadores y suscriptores.
            </p>
          </div>
        </div>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
