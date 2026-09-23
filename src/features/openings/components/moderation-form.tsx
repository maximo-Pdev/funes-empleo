"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FeedbackMessage, SelectField, TextField } from "@/components/ui";
import type { OpeningStatus } from "@/domain/states";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export type AdminOpeningDecision = "approved" | "changes_requested" | "rejected" | "paused" |
  "resumed" | "closed" | "suspended" | "restored_to_draft" | "cancelled";
export type ModerationPayload = {
  openingId: string; version: number; decision: AdminOpeningDecision;
  publicMessage: string; internalReason: string; confirmed: boolean;
};

const decisionLabels: Record<AdminOpeningDecision, string> = {
  approved: "Aprobar y publicar", changes_requested: "Solicitar correcciones", rejected: "Rechazar",
  paused: "Pausar", resumed: "Reanudar", closed: "Cerrar", suspended: "Suspender",
  restored_to_draft: "Devolver a borrador", cancelled: "Cancelar",
};
const visibleChoices: Partial<Record<OpeningStatus, readonly AdminOpeningDecision[]>> = {
  pending_review: ["approved", "changes_requested", "rejected", "suspended", "cancelled"],
  published: ["paused", "closed", "suspended", "cancelled"],
  paused: ["resumed", "closed", "suspended", "cancelled"],
  suspended: ["restored_to_draft"],
};
const publicMessageDecisions = new Set<AdminOpeningDecision>(["changes_requested", "rejected"]);
const reasonDecisions = new Set<AdminOpeningDecision>(["rejected", "paused", "closed", "suspended", "restored_to_draft", "cancelled"]);

export function ModerationForm({ openingId, version, status, onSubmit }: {
  openingId: string; version: number; status: OpeningStatus;
  onSubmit: (payload: ModerationPayload) => AdminMutationResult | Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<AdminOpeningDecision | "">("");
  const [publicMessage, setPublicMessage] = useState("");
  const [internalReason, setInternalReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const options = (visibleChoices[status] ?? []).map((value) => ({ value, label: decisionLabels[value] }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) { setError("Elegí una decisión."); return; }
    if (publicMessageDecisions.has(decision) && !publicMessage.trim()) {
      setError("Escribí una explicación accionable para la empresa."); return;
    }
    if (reasonDecisions.has(decision) && !internalReason.trim()) {
      setError("Ingresá un motivo interno para esta decisión."); return;
    }
    if (decision === "suspended" && !confirmed) {
      setError("Confirmá expresamente la suspensión."); return;
    }
    setError("");
    startTransition(async () => {
      try {
        const result = await onSubmit({ openingId, version, decision, publicMessage: publicMessage.trim(),
          internalReason: internalReason.trim(), confirmed });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result?.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        router.refresh();
      } catch { setError("No se pudo guardar. Recargá la página e intentá nuevamente."); }
    });
  }

  if (options.length === 0) return <p>No hay decisiones de moderación disponibles para este estado.</p>;
  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-300 bg-white p-5" noValidate>
      <h2 className="text-lg font-semibold">Decisión municipal sobre la oferta</h2>
      {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
      <SelectField id="moderation-decision" label="Decisión" value={decision} onChange={(event) => {
        setDecision(event.target.value as AdminOpeningDecision | ""); setError(""); setConfirmed(false);
      }} options={options} />
      {publicMessageDecisions.has(decision as AdminOpeningDecision) &&
        <TextField id="moderation-public-message" label="Explicación para la empresa" value={publicMessage}
          onChange={(event) => setPublicMessage(event.target.value)} maxLength={2000} required />}
      {reasonDecisions.has(decision as AdminOpeningDecision) &&
        <TextField id="moderation-internal-reason" label="Motivo interno" value={internalReason}
          onChange={(event) => setInternalReason(event.target.value)} maxLength={1000} required
          hint="Este motivo solo lo ve la Oficina de Empleo." />}
      {decision === "suspended" && <label className="flex items-start gap-2 rounded-md border border-red-400 bg-red-50 p-3 font-medium text-red-950">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        Confirmo la suspensión de esta oferta
      </label>}
      <Button type="submit" busy={pending}>Guardar decisión</Button>
    </form>
  );
}
