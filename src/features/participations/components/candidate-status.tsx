"use client";
import { Form } from "@/components/forms/form";
import Link from "next/link";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawParticipationAction } from "../candidate-actions";
import { FileInput } from "@/components/forms/file-input";
import { Button } from "@/components/ui/button";
import { CV_ACCEPT, CV_FILE_ERROR, CV_FORMAT_HINT, MAX_CV_BYTES } from "@/lib/files/cv-policy";

export function CandidateApplyForm({ openingId, candidateVersion, disabled, alreadyApplied = false, generalCvName, participationsHref = "/dashboard?section=postulaciones" }: {
  openingId: string; candidateVersion: number; disabled: boolean; alreadyApplied?: boolean; participationsHref?: string; generalCvName?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState({ message: "", success: false });
  const [pending, setPending] = useState(false);
  const [fileError, setFileError] = useState("");
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); if (state.success) router.refresh(); }, [state, router]);
  return <Form result={state} className="mt-3 grid gap-2" aria-busy={pending} onSubmit={async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    setPending(true); setFileError(""); setState({ message: "", success: false });
    try {
      const response = await fetch("/api/candidate/applications", { method: "POST", body: data });
      const result: { message?: string; success?: boolean; field?: string } = await response.json();
      if (response.ok && result.success) {
        form.reset(); setState({ message: "Postulación recibida por la Oficina de Empleo.", success: true });
      } else {
        if (result.field === "cv") setFileError(result.message ?? "Revisá el archivo seleccionado.");
        setState({ message: result.message || "No se pudo registrar la postulación. El archivo seleccionado se conserva.", success: false });
      }
    } catch {
      setState({ message: "No se pudo confirmar la postulación. Revisá tus postulaciones antes de reintentar; el archivo seleccionado se conserva.", success: false });
    } finally { setPending(false); }
  }}>
    <input type="hidden" name="openingId" value={openingId} /><input type="hidden" name="candidateVersion" value={candidateVersion} />
    {!alreadyApplied && !state.success && <>
      <p className="text-sm text-muted-foreground">Si no adjuntás otro archivo, se usará tu CV del perfil{generalCvName ? `: ${generalCvName}` : ""}.</p>
      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Usar otro CV para esta oferta</summary>
        <div className="mt-3"><FileInput label="CV específico para esta oferta (opcional)" name="cv" accept={CV_ACCEPT}
          error={fileError} onChange={() => { setFileError(""); setState({ message: "", success: false }); }}
          hint={`${CV_FORMAT_HINT} No reemplaza tu CV del perfil ni el de otras postulaciones.`}
          data-max-bytes={MAX_CV_BYTES} data-file-error={CV_FILE_ERROR} disabled={disabled || pending} /></div>
      </details>
    </>}
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <Button type="submit" disabled={disabled || pending || alreadyApplied || state.success}>{alreadyApplied || state.success ? "Participación registrada" : pending ? "Enviando postulación…" : "Postularme"}</Button>
    {(alreadyApplied || state.success) && <Link href={participationsHref} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Ver mis postulaciones</Link>}
  </Form>;
}

export function CandidateWithdrawForm({ participationId, version }: { participationId: string; version: number }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(withdrawParticipationAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); if (state.success) router.refresh(); }, [state, router]);
  return <Form action={action} result={state} className="mt-3 grid gap-2" aria-busy={pending}>
    <input type="hidden" name="participationId" value={participationId} /><input type="hidden" name="version" value={version} />
    <Field className="flex gap-2"><input type="checkbox" name="confirmed" required />Confirmo que quiero retirar esta participación.</Field>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button disabled={pending} className="rounded border border-red-700 p-2 text-red-900">Retirar participación</button>
  </Form>;
}
