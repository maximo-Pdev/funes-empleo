"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FeedbackMessage, SelectField, TextField } from "@/components/ui";
import type { ParticipationStatus } from "@/domain/states";
import { PREINTERVIEW_CHANNELS } from "@/domain/catalogs";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export type ParticipationCommand = "start_review" | "record_preinterview" | "preselect" |
  "skip_to_preinterview" | "skip_to_preselected" | "refer" | "mark_awaiting_feedback" |
  "confirm_hired" | "confirm_not_selected" | "correct_hired" | "correct_not_selected" |
  "correct_cancelled" | "withdraw_on_request" | "cancel_individual";
export type ParticipationActionPayload = {
  participationId: string; version: number; command: ParticipationCommand;
  reason: string; channel: string; summary: string;
};

const actions: Partial<Record<ParticipationStatus, readonly { value: ParticipationCommand; label: string }[]>> = {
  received: [
    { value: "start_review", label: "Iniciar revisión" }, { value: "record_preinterview", label: "Registrar preentrevista" },
    { value: "skip_to_preinterview", label: "Omitir revisión y pasar a preentrevista" },
    { value: "skip_to_preselected", label: "Omitir etapas y preseleccionar" },
    { value: "refer", label: "Derivar explícitamente" },
  ],
  under_review: [
    { value: "record_preinterview", label: "Registrar preentrevista" }, { value: "preselect", label: "Preseleccionar" },
    { value: "skip_to_preselected", label: "Omitir preentrevista y preseleccionar" },
    { value: "refer", label: "Derivar explícitamente" },
  ],
  preinterview: [{ value: "preselect", label: "Preseleccionar" }, { value: "refer", label: "Derivar explícitamente" }],
  preselected: [{ value: "refer", label: "Derivar explícitamente" }],
  referred: [{ value: "mark_awaiting_feedback", label: "Marcar espera de respuesta" },
    { value: "confirm_hired", label: "Confirmar contratación" }, { value: "confirm_not_selected", label: "Confirmar no selección" }],
  company_interview: [{ value: "mark_awaiting_feedback", label: "Marcar espera de respuesta" },
    { value: "confirm_hired", label: "Confirmar contratación" }, { value: "confirm_not_selected", label: "Confirmar no selección" }],
  awaiting_feedback: [{ value: "confirm_hired", label: "Confirmar contratación" },
    { value: "confirm_not_selected", label: "Confirmar no selección" }],
  no_company_response: [{ value: "correct_hired", label: "Corregir a contratación" },
    { value: "correct_not_selected", label: "Corregir a no selección" },
    { value: "correct_cancelled", label: "Corregir a cancelación" }],
};
const alwaysReasonRequired = new Set<ParticipationCommand>([
  "skip_to_preinterview", "skip_to_preselected", "withdraw_on_request", "cancel_individual",
  "correct_hired", "correct_not_selected", "correct_cancelled",
]);

function requiresStageReason(command: ParticipationCommand | "", status: ParticipationStatus) {
  return alwaysReasonRequired.has(command as ParticipationCommand) ||
    (command === "record_preinterview" && status === "received") ||
    (command === "preselect" && (status === "received" || status === "under_review")) ||
    (command === "refer" && status !== "preselected");
}

export function ParticipationActionForm({ participationId, version, status, onSubmit }: {
  participationId: string; version: number; status: ParticipationStatus;
  onSubmit: (payload: ParticipationActionPayload) => AdminMutationResult | Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [command, setCommand] = useState<ParticipationCommand | "">("");
  const [reason, setReason] = useState("");
  const [channel, setChannel] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const choices = [...(actions[status] ?? [])];
  if (!["hired", "not_selected", "withdrawn", "cancelled", "no_company_response"].includes(status)) {
    choices.push({ value: "withdraw_on_request", label: "Registrar retiro pedido por candidato" });
    choices.push({ value: "cancel_individual", label: "Cancelar solo este caso" });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!command) { setError("Elegí una acción."); return; }
    if (requiresStageReason(command, status) && !reason.trim()) {
      setError("Ingresá un motivo para esta acción."); return;
    }
    if (command === "record_preinterview" && !channel) {
      setError("Indicá el canal de la preentrevista."); return;
    }
    setError("");
    startTransition(async () => {
      try {
        const result = await onSubmit({ participationId, version, command, reason: reason.trim(), channel, summary: summary.trim() });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result?.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        router.refresh();
      } catch { setError("No se pudo guardar. Recargá la página e intentá nuevamente."); }
    });
  }

  if (choices.length === 0) return <p>Este caso tiene un resultado final y no admite nuevas acciones.</p>;
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-300 bg-white p-5" noValidate>
    <h2 className="text-lg font-semibold">Acciones sobre la participación</h2>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    <SelectField id="participation-command" label="Acción" value={command} onChange={(event) => {
      setCommand(event.target.value as ParticipationCommand | ""); setError("");
    }} options={choices} />
    {command === "record_preinterview" && <>
      <SelectField id="preinterview-channel" label="Canal de preentrevista" value={channel}
        onChange={(event) => setChannel(event.target.value)}
        options={PREINTERVIEW_CHANNELS.map((value) => ({ value, label: ({ phone: "Teléfono", email: "Correo", whatsapp: "WhatsApp", in_person: "Presencial", video: "Video" })[value] }))} />
      <TextField id="preinterview-summary" label="Resumen interno" value={summary}
        onChange={(event) => setSummary(event.target.value)} maxLength={5000} />
    </>}
    {requiresStageReason(command, status) && <TextField id="participation-reason" label="Motivo interno"
      value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} required />}
    {command === "refer" && <FeedbackMessage tone="info">La derivación requiere una decisión explícita de la Oficina. Solo entonces la empresa puede ver los datos autorizados.</FeedbackMessage>}
    {command?.startsWith("skip_") && <p className="text-sm text-slate-700">La derivación requiere una decisión explícita posterior.</p>}
    {command?.startsWith("correct_") && <FeedbackMessage tone="info">El cierre automático anterior quedará en el historial y el acceso empresarial revocado no se reactivará.</FeedbackMessage>}
    <Button type="submit" busy={pending}>Registrar acción</Button>
  </form>;
}
