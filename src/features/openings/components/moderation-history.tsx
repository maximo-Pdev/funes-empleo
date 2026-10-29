"use client";
import { formatFunesDateTime } from "@/lib/time/presentation";
import { useEffect, useRef, useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import { displayLabel, moderationDecisionLabels, openingStatusLabels } from "@/domain/presentation/labels";

export type ModerationHistoryEvent = {
  id: string; decision: string; previousStatus: string | null; newStatus: string; at: string;
  message?: string | null; internalReason?: string | null; actorLabel?: string;
};

export function ModerationHistory({ events }: { events: ModerationHistoryEvent[] }) {
  const [visible, setVisible] = useState(5);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (focusIndex !== null) (list.current?.children.item(focusIndex) as HTMLElement | null)?.focus();
  }, [focusIndex]);
  return <section aria-labelledby="opening-history" className="space-y-4">
    <h2 id="opening-history" className="text-xl font-semibold">Historial de moderación</h2>
    {events.length === 0 ? <EmptyState title="Sin decisiones registradas" description="Todavía no hay eventos de moderación para esta oferta." /> :
      <ol ref={list} className="space-y-3">{events.slice(0, visible).map(event => <li key={event.id} tabIndex={-1}
        className="rounded-lg border border-border bg-surface p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <p className="font-semibold">{displayLabel(moderationDecisionLabels, event.decision, "Decisión registrada")}: {event.previousStatus ? displayLabel(openingStatusLabels, event.previousStatus) : "Inicio"} → {displayLabel(openingStatusLabels, event.newStatus)}</p>
        <p className="text-sm text-muted-foreground"><time dateTime={event.at}>{formatFunesDateTime(event.at)}</time>{event.actorLabel ? ` · ${event.actorLabel}` : ""}</p>
        {event.message && <p className="mt-2">Mensaje de la Oficina: {event.message}</p>}
        {event.internalReason && <p className="mt-2">Motivo interno: {event.internalReason}</p>}
      </li>)}</ol>}
    <p role="status" aria-live="polite" className="sr-only">{visible > 5 ? `${Math.min(visible, events.length)} de ${events.length} eventos visibles.` : ""}</p>
    {visible < events.length && <Button variant="secondary" onClick={() => { setFocusIndex(visible); setVisible(Math.min(visible + 5, events.length)); }}>Mostrar más</Button>}
  </section>;
}
