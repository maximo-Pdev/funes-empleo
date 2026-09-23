import { FeedbackMessage } from "@/components/ui";
import type { ParticipationStatus } from "@/domain/states";

export type ParticipationHistoryEvent = {
  id: string; occurredAt: string; action: string; actorLabel: string;
  previousStatus: string | null; newStatus: string | null; reason?: string | null;
};

const stateLabels: Partial<Record<ParticipationStatus, string>> = {
  received: "Recibida", under_review: "En revisión", preinterview: "Preentrevista",
  preselected: "Preseleccionada", referred: "Derivada", company_interview: "Entrevista empresarial",
  awaiting_feedback: "Esperando respuesta", hired: "Persona contratada", not_selected: "No seleccionada",
  withdrawn: "Retirada", cancelled: "Cancelada", no_company_response: "Sin respuesta empresarial",
};

export function participationStatusLabel(status: ParticipationStatus): string {
  return stateLabels[status] ?? status;
}

export function ParticipationTimeline({ currentStatus, events }: {
  currentStatus: ParticipationStatus; events: readonly ParticipationHistoryEvent[];
}) {
  const hasLateCorrection = currentStatus !== "no_company_response" &&
    events.some((event) => event.newStatus === "no_company_response") &&
    events.some((event) => event.previousStatus === "no_company_response");
  return <section aria-labelledby="participation-history-title" className="space-y-4">
    <h2 id="participation-history-title" className="text-lg font-semibold">Historial de la participación</h2>
    <div role="status" className="rounded-md border border-blue-400 bg-blue-50 p-4 font-semibold text-blue-950">
      Resultado o estado vigente: {participationStatusLabel(currentStatus)}
    </div>
    {hasLateCorrection && <FeedbackMessage tone="info">Sin respuesta empresarial: cierre automático anterior reemplazado por el resultado vigente. El historial se conserva.</FeedbackMessage>}
    {events.length === 0 ? <p>No hay eventos registrados todavía.</p> : <ol className="space-y-3 border-l-2 border-slate-300 pl-5">
      {events.map((event) => <li key={event.id} className="rounded-md border border-slate-200 bg-white p-3">
        <p className="font-medium">{stateLabels[event.newStatus as ParticipationStatus] ?? event.action}</p>
        <p className="text-sm text-slate-700">{new Date(event.occurredAt).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })} · {event.actorLabel}</p>
        {event.reason && <p className="mt-1 text-sm">Código de motivo: {event.reason}</p>}
      </li>)}
    </ol>}
  </section>;
}
