import { AdminTitle } from "@/components/admin/AdminUi";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { getSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <AdminTitle
        title="Apariencia y configuración del sitio"
        subtitle="Cambia el logo, la portada, la imagen de fondo, el pie de página, el título, «Sobre mí», contacto, redes sociales, el aviso +18 y los textos VIP."
      />
      <SettingsEditor initial={settings} />
    </div>
  );
}
