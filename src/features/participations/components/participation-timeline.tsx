import { Badge, FeedbackMessage } from "@/components/ui";
import type { ParticipationStatus } from "@/domain/states";
import { participationStatusLabels, displayLabel, auditActionLabel, reasonLabel } from "@/domain/presentation/labels";
import { participationStatusTones, statusTone } from "@/domain/presentation/status-tone";

export type ParticipationHistoryEvent = {
  id: string; occurredAt: string; action: string; actorLabel: string;
  previousStatus: string | null; newStatus: string | null;
  reason?: string | null; reasonCode?: string | null;
};

export function participationStatusLabel(status: ParticipationStatus): string {
  return displayLabel(participationStatusLabels, status);
}

export function ParticipationTimeline({ currentStatus, events }: {
  currentStatus: ParticipationStatus; events: readonly ParticipationHistoryEvent[];
}) {
  const hasLateCorrection = currentStatus !== "no_company_response" &&
    events.some((event) => event.newStatus === "no_company_response") &&
    events.some((event) => event.previousStatus === "no_company_response");
  return <section aria-labelledby="participation-history-title" className="space-y-4">
    <h2 id="participation-history-title" className="text-lg font-semibold">Historial de la participación</h2>
    <div role="status" className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-muted p-4 font-semibold text-foreground">
      Resultado o estado vigente <Badge variant="status" tone={statusTone(participationStatusTones, currentStatus)}>{participationStatusLabel(currentStatus)}</Badge>
    </div>
    {hasLateCorrection && <FeedbackMessage tone="info">Sin respuesta empresarial: cierre automático anterior reemplazado por el resultado vigente. El historial se conserva.</FeedbackMessage>}
    {events.length === 0 ? <p>No hay eventos registrados todavía.</p> : <ol className="space-y-3 border-l-2 border-slate-300 pl-5">
      {events.map((event) => <li key={event.id} className="rounded-md border border-slate-200 bg-white p-3">
        <p className="font-medium">{displayLabel(participationStatusLabels, event.newStatus, auditActionLabel(event.action))}</p>
        <p className="text-sm text-slate-700">{new Date(event.occurredAt).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })} · {event.actorLabel}</p>
        {event.reasonCode && <p className="mt-1 text-sm">Motivo: {reasonLabel(event.reasonCode)}</p>}
        {event.reason && <p className="mt-1 text-sm">Motivo interno: {event.reason}</p>}
      </li>)}
    </ol>}
  </section>;
}
