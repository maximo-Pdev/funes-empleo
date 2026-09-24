"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { applyToOfferAction, withdrawParticipationAction } from "../candidate-actions";

export function CandidateApplyForm({ openingId, candidateVersion, disabled, alreadyApplied = false }: {
  openingId: string; candidateVersion: number; disabled: boolean; alreadyApplied?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(applyToOfferAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); if (state.success) router.refresh(); }, [state, router]);
  return <form action={action} className="mt-3 grid gap-2" aria-busy={pending}>
    <input type="hidden" name="openingId" value={openingId} /><input type="hidden" name="candidateVersion" value={candidateVersion} />
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button disabled={disabled || pending || alreadyApplied} className="rounded bg-blue-800 p-2 text-white disabled:opacity-50">{alreadyApplied ? "Participación registrada" : "Postularme"}</button>
  </form>;
}

export function CandidateWithdrawForm({ participationId, version }: { participationId: string; version: number }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(withdrawParticipationAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); if (state.success) router.refresh(); }, [state, router]);
  return <form action={action} className="mt-3 grid gap-2" aria-busy={pending}>
    <input type="hidden" name="participationId" value={participationId} /><input type="hidden" name="version" value={version} />
    <label className="flex gap-2"><input type="checkbox" name="confirmed" required />Confirmo que quiero retirar esta participación.</label>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button disabled={pending} className="rounded border border-red-700 p-2 text-red-900">Retirar participación</button>
  </form>;
}
