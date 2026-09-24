"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FeedbackMessage, SelectField, TextField } from "@/components/ui";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export function InternalNoteForm({ candidateId, version, onSubmit }: {
  candidateId: string; version: number;
  onSubmit: (input: unknown) => Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [command, setCommand] = useState("record_applicant_note");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) { setError("Escribí la nota interna."); return; }
    setError("");
    startTransition(async () => {
      try {
        const result = await onSubmit({ command, candidateId, version, body: body.trim() });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result?.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        router.refresh();
      } catch { setError("No se pudo guardar la nota. Recargá e intentá nuevamente."); }
    });
  }
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-300 bg-white p-5" noValidate>
    <h2 className="text-lg font-semibold">Nota interna de la Oficina</h2>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    <SelectField id="note-kind" label="Tipo" value={command} onChange={(event) => setCommand(event.target.value)}
      options={[{ value: "record_applicant_note", label: "Nota sobre postulante" },
        { value: "record_training_guidance", label: "Orientación o capacitación" }]} />
    <TextField id="note-body" label="Contenido interno" value={body}
      onChange={(event) => setBody(event.target.value)} maxLength={5000} required />
    <Button type="submit" busy={pending}>Guardar nota</Button>
  </form>;
}
