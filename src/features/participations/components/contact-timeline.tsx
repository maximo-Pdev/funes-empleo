import type { ContactItem } from "../contact-service";
import { orderContacts } from "../contact-order";
const labels: Record<string, string> = { phone: "Teléfono", email: "Correo", whatsapp: "WhatsApp", in_person: "Presencial" };
const date = (v: string) => new Date(v).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" });
export function ContactTimeline({ contacts }: { contacts: readonly ContactItem[] }) {
  return <section aria-labelledby="contact-timeline-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
    <h2 id="contact-timeline-title" className="text-xl font-semibold">Historial de contactos</h2>
    <p>Uso interno. Orden cronológico, del más antiguo al más reciente.</p>
    {contacts.length === 0 ? <p>No hay contactos registrados para este caso.</p> : <ol className="space-y-4">
      {orderContacts(contacts).map((c) => <li key={c.id} className="border-l-2 border-blue-600 pl-3">
        <p><strong>{labels[c.channel] ?? c.channel}</strong> · {c.direction === "inbound" ? "Recibido" : "Iniciado por la Oficina"}</p>
        <time dateTime={c.occurred_at}>{date(c.occurred_at)}</time>
        <p className="whitespace-pre-wrap break-words">{c.summary_internal}</p>
        <p className="break-all text-sm">Registrado por: {c.recorded_by}</p>
        {c.next_action_at && <p>Próximo seguimiento: <time dateTime={c.next_action_at}>{date(c.next_action_at)}</time></p>}
      </li>)}
    </ol>}
  </section>;
}
