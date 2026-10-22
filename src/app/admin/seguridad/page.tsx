import { FaShieldAlt } from "react-icons/fa";
import { AdminTitle } from "@/components/admin/AdminUi";
import { SecurityForm } from "@/components/admin/SecurityForm";
import { requireAdmin } from "@/lib/auth";
import { cardCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export default async function AdminSecurityPage() {
  const admin = await requireAdmin();
  return (
    <div className="space-y-6">
      <AdminTitle title="Seguridad" subtitle="Cambia el usuario, el correo y la contraseña personalizada del administrador." />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className={cn(cardCls, "p-6")}>
          <SecurityForm username={admin.user.username} email={admin.user.email} />
        </div>
        <div className={cn(cardCls, "space-y-3 p-6 text-sm text-zinc-300")}>
          <p className="flex items-center gap-2 font-bold text-white">
            <FaShieldAlt className="text-brand" /> Recomendaciones
          </p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>Usa una contraseña de al menos 8 caracteres con letras, números y símbolos.</li>
            <li>No reutilices la contraseña de otros servicios.</li>
            <li>Puedes nombrar a otros usuarios administradores desde «Usuarios».</li>
            <li>Las contraseñas se guardan cifradas (scrypt) y nunca en texto plano.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
