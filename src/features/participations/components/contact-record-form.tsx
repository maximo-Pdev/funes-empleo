"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FeedbackMessage, SelectField, TextField } from "@/components/ui";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export function ContactRecordForm({ participationId, version, onSubmit }: {
  participationId: string; version: number;
  onSubmit: (input: unknown) => Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [channel, setChannel] = useState("phone");
  const [direction, setDirection] = useState("inbound");
  const [occurredAtLocal, setOccurredAtLocal] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!occurredAtLocal || !summary.trim()) {
      setError("Indicá fecha y resumen del contacto."); return;
    }
    setError("");
    startTransition(async () => {
      try {
        const result = await onSubmit({ command: "record_contact", participationId, version,
          channel, direction, occurredAtLocal, summary: summary.trim() });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result?.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        router.refresh();
      } catch { setError("No se pudo guardar el contacto. Recargá e intentá nuevamente."); }
    });
  }
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-300 bg-white p-5" noValidate>
    <h2 className="text-lg font-semibold">Registrar contacto municipal</h2>
    <p className="text-sm text-slate-700">El resumen es interno. Un contacto entrante puede respaldar un retiro pedido por el candidato.</p>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    <SelectField id="contact-channel" label="Canal" value={channel} onChange={(event) => setChannel(event.target.value)}
      options={[{ value: "phone", label: "Teléfono" }, { value: "email", label: "Correo" },
        { value: "whatsapp", label: "WhatsApp" }, { value: "in_person", label: "Presencial" }]} />
    <SelectField id="contact-direction" label="Dirección" value={direction} onChange={(event) => setDirection(event.target.value)}
      options={[{ value: "inbound", label: "Recibido" }, { value: "outbound", label: "Realizado" }]} />
    <TextField id="contact-date" label="Fecha y hora (Funes)" type="datetime-local"
      value={occurredAtLocal} onChange={(event) => setOccurredAtLocal(event.target.value)} required />
    <TextField id="contact-summary" label="Resumen interno" value={summary}
      onChange={(event) => setSummary(event.target.value)} maxLength={5000} required />
    <Button type="submit" busy={pending}>Guardar contacto</Button>
  </form>;
}
