"use client";
import { formatFunesDateTime } from "@/lib/time/presentation";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, EmptyState, FeedbackMessage } from "@/components/ui";
import { auditActionLabel } from "@/domain/presentation/labels";
import { loadCandidateHistoryAction } from "../history-actions";
import type { CandidateHistoryCursor, CandidateHistoryEvent } from "../candidate-history";

export function CandidateHistory({ candidateId, initialEvents, initialCursor }: {
  candidateId: string; initialEvents: CandidateHistoryEvent[]; initialCursor: CandidateHistoryCursor | null;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [cursor, setCursor] = useState(initialCursor);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (focusIndex !== null) (list.current?.children.item(focusIndex) as HTMLElement | null)?.focus();
  }, [focusIndex]);

  function loadMore() {
    if (!cursor || pending) return;
    setError("");
    start(async () => {
      try {
        const result = await loadCandidateHistoryAction({ candidateId, cursor });
        if (!result.success) { setError(result.message); return; }
        const known = new Set(events.map(event => event.id));
        const added = result.page.events.filter(event => !known.has(event.id));
        setEvents([...events, ...added]); setCursor(result.page.nextCursor);
        if (added.length) setFocusIndex(events.length);
        setAnnouncement(added.length ? `${added.length} ${added.length === 1 ? "evento anterior cargado" : "eventos anteriores cargados"}.` : "No hay más eventos para mostrar.");
      } catch { setError("No se pudo cargar el historial. Volvé a intentar."); }
    });
  }

  return <section aria-labelledby="candidate-history" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
    <h2 id="candidate-history" className="text-xl font-semibold">Historial de cuenta y perfil</h2>
    {events.length === 0 ? <EmptyState title="Sin eventos para mostrar" description="No hay eventos de cuenta y perfil para mostrar." /> :
      <ol ref={list} className="space-y-3">{events.map(event => <li key={event.id} tabIndex={-1}
        className="space-y-1 border-t border-border pt-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <p className="font-semibold">{auditActionLabel(event.action)}</p>
        <time dateTime={event.occurred_at} className="text-sm text-muted-foreground">{formatFunesDateTime(event.occurred_at)}</time>
      </li>)}</ol>}
    <p role="status" aria-live="polite" className="sr-only">{pending ? "Cargando eventos anteriores…" : announcement}</p>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    {cursor && <Button variant="secondary" busy={pending} busyLabel="Cargando…" onClick={loadMore}>Ver más</Button>}
  </section>;
}
