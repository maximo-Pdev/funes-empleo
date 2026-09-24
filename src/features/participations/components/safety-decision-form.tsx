"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FeedbackMessage, TextField } from "@/components/ui";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export type SafetyDecisionPayload = {
  resource: "candidate_account" | "candidate_profile" | "opening";
  resourceId: string; version: number; action: "suspend" | "reactivate" | "restore";
  reason: string; confirmed: boolean;
};

export function SafetyDecisionForm({ resource, resourceId, version, action, onSubmit }: {
  resource: SafetyDecisionPayload["resource"]; resourceId: string; version: number;
  action: SafetyDecisionPayload["action"];
  onSubmit: (payload: SafetyDecisionPayload) => AdminMutationResult | Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) { setError("Ingresá un motivo interno."); return; }
    if (!confirmed) { setError("Confirmá expresamente esta decisión."); return; }
    setError("");
    startTransition(async () => {
      try {
        const result = await onSubmit({ resource, resourceId, version, action, reason: reason.trim(), confirmed });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result?.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        router.refresh();
      } catch { setError("No se pudo guardar. Recargá la página e intentá nuevamente."); }
    });
  }
  return <form onSubmit={submit} className={`space-y-4 rounded-lg border p-5 ${action === "suspend" ? "border-red-500 bg-red-50" : "border-amber-500 bg-amber-50"}`} noValidate>
    <h2 className="text-lg font-semibold">{action === "suspend" ? "Suspensión de acceso" : action === "reactivate" ? "Reactivación de cuenta" : "Restauración segura"}</h2>
    {action === "restore" && <p>El perfil candidato vuelve a borrador; restaurarlo no reactiva participaciones, derivaciones ni accesos anteriores.</p>}
    {action === "reactivate" && <p>El perfil candidato conserva su estado anterior; reactivar la cuenta no repone participaciones, derivaciones ni accesos revocados.</p>}
    {action === "suspend" && <p>Esta acción bloquea operaciones privadas y puede revocar accesos empresariales. Los casos y su historial permanecen.</p>}
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    <TextField id="safety-reason" label="Motivo interno" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} required />
    <label className="flex items-center gap-2 font-semibold">
      <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
      {action === "suspend" ? "Confirmo la suspensión" : action === "reactivate" ? "Confirmo la reactivación" : "Confirmo la restauración"}
    </label>
    <Button type="submit" variant={action === "suspend" ? "danger" : "secondary"} busy={pending}>
      {action === "suspend" ? "Suspender cuenta" : action === "reactivate" ? "Reactivar cuenta" : "Restaurar a borrador"}
    </Button>
  </form>;
}
