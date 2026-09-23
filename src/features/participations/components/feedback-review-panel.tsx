"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, FeedbackMessage, TextField } from "@/components/ui";
import type { ParticipationStatus } from "@/domain/states";
import { participationStatusLabel } from "./participation-timeline";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export type PendingFeedback = {
  id: string; reportedOutcome: string; reportedAt: string;
  reviewStatus: "pending_admin" | "accepted" | "superseded"; message: string | null;
};
export type ConfirmFeedbackPayload = {
  participationId: string; version: number; feedbackId: string;
  outcome: "hired" | "not_selected" | "cancelled"; reason: string;
};

function proposedOutcome(value: string): ConfirmFeedbackPayload["outcome"] | null {
  if (value === "hired" || value === "not_selected") return value;
  if (value === "process_cancelled") return "cancelled";
  return null;
}

export function FeedbackReviewPanel({ participationId, version, currentStatus, feedback, onConfirm }: {
  participationId: string; version: number; currentStatus: ParticipationStatus;
  feedback: readonly PendingFeedback[];
  onConfirm: (payload: ConfirmFeedbackPayload) => AdminMutationResult | Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const latest = [...feedback].filter((item) => item.reviewStatus === "pending_admin")
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))[0];
  if (!latest) return <EmptyState title="Sin feedback pendiente" description="La empresa todavía no comunicó un resultado para revisar." />;
  const outcome = proposedOutcome(latest.reportedOutcome);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!latest || !outcome) { setError("Este feedback requiere revisión manual antes de asignar un resultado."); return; }
    if ((outcome === "cancelled" || currentStatus === "no_company_response") && !reason.trim()) {
      setError("Registrá el motivo de la decisión administrativa."); return;
    }
    setError("");
    startTransition(async () => {
      try {
        const result = await onConfirm({ participationId, version, feedbackId: latest.id, outcome, reason: reason.trim() });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result?.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        router.refresh();
      } catch { setError("No se pudo guardar. Recargá la página e intentá nuevamente."); }
    });
  }
  return <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-5" aria-labelledby="feedback-title">
    <h2 id="feedback-title" className="text-lg font-semibold">Feedback de la empresa</h2>
    <p>Estado actual: <strong>{participationStatusLabel(currentStatus)}</strong>. El resultado comunicado está pendiente de confirmación administrativa.</p>
    <p>Comunicación recibida: <strong>{latest.reportedOutcome === "hired" ? "Contratación informada" : latest.reportedOutcome === "not_selected" ? "No selección informada" : latest.reportedOutcome === "process_cancelled" ? "Cancelación de este proceso informada" : "Otro resultado informado"}</strong>.</p>
    {latest.message && <p className="rounded-md bg-slate-100 p-3">{latest.message}</p>}
    {currentStatus === "no_company_response" && <FeedbackMessage tone="info">La corrección tardía conserva el cierre automático anterior y no restaura el acceso empresarial revocado.</FeedbackMessage>}
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    {outcome ? <form onSubmit={submit} className="space-y-4" noValidate>
      {(outcome === "cancelled" || currentStatus === "no_company_response") &&
        <TextField id="feedback-reason" label="Motivo interno" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} required />}
      <Button type="submit" busy={pending}>Confirmar resultado</Button>
    </form> : <p>La Oficina debe registrar la evidencia correspondiente antes de elegir un resultado.</p>}
  </section>;
}
