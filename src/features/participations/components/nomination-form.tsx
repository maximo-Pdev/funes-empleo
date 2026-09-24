"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FeedbackMessage, SelectField } from "@/components/ui";
import { adminMutationError, type AdminMutationResult } from "@/lib/errors/admin-mutation-result";

type Opening = { id: string; title: string | null; version: number; status: string };

export function NominationForm({ candidateId, candidateVersion, openings, onSubmit }: {
  candidateId: string; candidateVersion: number; openings: Opening[];
  onSubmit: (input: unknown) => Promise<Exclude<AdminMutationResult, void> & { participationId?: string }>;
}) {
  const router = useRouter();
  const [openingId, setOpeningId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const opening = openings.find((item) => item.id === openingId);
    if (!opening) { setError("Elegí una oferta vigente."); return; }
    setError("");
    startTransition(async () => {
      try {
        const result = await onSubmit({ candidateId, candidateVersion, openingId, openingVersion: opening.version });
        const message = adminMutationError(result);
        if (message) { setError(message); if (result.code === "CONFLICT_STALE_DATA") router.refresh(); return; }
        if (result.participationId) router.push(`/admin/participations/${result.participationId}`);
      } catch { setError("No se pudo crear la nominación. Recargá e intentá nuevamente."); }
    });
  }

  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-300 bg-white p-5" noValidate>
    <h2 className="text-lg font-semibold">Nominar a una oferta</h2>
    <p className="text-sm text-slate-700">La nominación inicia una revisión municipal. La empresa solo recibe datos tras una derivación explícita con CV y consentimiento vigentes.</p>
    {openings.length === 0 ? <p>No hay ofertas vigentes para nominar.</p> : <>
      {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
      <SelectField id="nomination-opening" label="Oferta" value={openingId}
        onChange={(event) => setOpeningId(event.target.value)}
        options={[{ value: "", label: "Elegí una oferta" }, ...openings.map((item) => ({
          value: item.id, label: `${item.title ?? "Oferta sin título"} (${item.status === "paused" ? "pausada" : "publicada"})`,
        }))]} />
      <Button type="submit" busy={pending}>Crear nominación</Button>
    </>}
  </form>;
}
