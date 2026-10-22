import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FaCheck } from "react-icons/fa";
import { Notice } from "@/components/Bits";
import { RegisterForm } from "@/components/forms/PublicForms";
import { AuthShell } from "@/components/PageSections";
import { getViewer } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : "");
  const settings = await getSettings();
  const viewer = await getViewer();
  if (viewer.user) redirect(next || "/cuenta");

  return (
    <AuthShell
      title="Crear cuenta gratis"
      subtitle="Regístrate para ver el contenido más explícito reservado a miembros."
      aside={
        <div className="rounded-3xl border border-brand/30 bg-linear-to-br from-brand/20 to-purple-900/20 p-8">
          <h2 className="text-2xl font-black text-white">Ventajas de registrarte</h2>
          <ul className="mt-5 space-y-3 text-sm text-zinc-200">
            {[
              "Acceso al contenido para usuarios registrados",
              "Galerías completas, videos y enlaces de descarga exclusivos",
              "Posibilidad de hacerte VIP y desbloquearlo todo",
              "Es gratis y solo tardas un minuto",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[10px] text-white">
                  <FaCheck />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      {settings.allowRegistration ? (
        <RegisterForm next={next} />
      ) : (
        <Notice kind="error">El registro de nuevos usuarios está desactivado temporalmente.</Notice>
      )}
    </AuthShell>
  );
}
