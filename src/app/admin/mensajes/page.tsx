import { desc } from "drizzle-orm";
import { FaEnvelope, FaEnvelopeOpen, FaReply, FaTrash } from "react-icons/fa";
import { deleteMessageForm, toggleMessageReadForm } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/AdminUi";
import { ConfirmButton, SubmitButton } from "@/components/ui/Buttons";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { btnSmall, cardCls } from "@/lib/ui";
import { cn, formatDate } from "@/lib/utils";

export default async function AdminMessagesPage() {
  const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(300);
  return (
    <div className="space-y-6">
      <AdminTitle title="Mensajes de contacto" subtitle="Mensajes enviados desde el formulario de la página de contacto." />
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={cn(cardCls, "p-5", !m.read && "border-brand/50 bg-brand/5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-bold text-white">
                  {!m.read && <span className="h-2 w-2 rounded-full bg-brand" />}
                  {m.subject || "(Sin asunto)"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {m.name} · {m.email} · {formatDate(m.createdAt)}
                </p>
              </div>
              <div className="flex gap-1.5">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className={btnSmall}>
                  <FaReply /> Responder
                </a>
                <form action={toggleMessageReadForm}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                  <SubmitButton className={btnSmall} pendingText="...">
                    {m.read ? (
                      <>
                        <FaEnvelope /> No leído
                      </>
                    ) : (
                      <>
                        <FaEnvelopeOpen /> Leído
                      </>
                    )}
                  </SubmitButton>
                </form>
                <form action={deleteMessageForm}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton className="rounded-lg bg-red-500/10 p-2 text-xs text-red-300 hover:bg-red-500/20" message="¿Eliminar este mensaje?">
                    <FaTrash />
                  </ConfirmButton>
                </form>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{m.message}</p>
          </div>
        ))}
        {!messages.length && <p className={cn(cardCls, "p-10 text-center text-zinc-400")}>Todavía no has recibido mensajes.</p>}
      </div>
    </div>
  );
}
