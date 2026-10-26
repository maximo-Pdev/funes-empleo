"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { registerCandidateAction } from "../registration-actions";
import { PasswordField } from "@/features/accounts/components/password-field";
import { dniField } from "@/components/forms/identifier-fields";

export function CandidateRegistrationForm({ submitLabel = "Crear cuenta candidata", homepageLayout = false, onSent, defaultValues }: { submitLabel?: string; homepageLayout?: boolean; onSent?: (result: { email: string; message: string }) => void; defaultValues?: Record<string, string> } = {}) {
  const [state, action, pending] = useActionState(registerCandidateAction, { message: "", success: false });
  const [submittedEmail, setSubmittedEmail] = useState("");
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  useEffect(() => { if (state.success && submittedEmail) onSent?.({ email: submittedEmail, message: state.message }); }, [state, submittedEmail, onSent]);
  const labelContent = (text: string) => homepageLayout ? <span>{text}</span> : text;
  return <Form action={action} result={state} requiredMarkers={homepageLayout ? "muted" : "always"} missingFieldMessages={homepageLayout ? "summary" : "inline"} preserveOnSuccess className="mt-6 grid gap-4" aria-busy={pending}
    onSubmitCapture={event => setSubmittedEmail(String(new FormData(event.currentTarget).get("email") ?? ""))}>
    <Field className="grid gap-1 font-semibold">{labelContent("Nombre y apellido")}<input name="name" required minLength={2} maxLength={200} autoComplete="name" className="rounded border p-3" defaultValue={defaultValues?.name ?? ""} /></Field>
    <Field className="grid gap-1 font-semibold">{labelContent("DNI")}<input {...dniField} name="dni" required inputMode="numeric" minLength={7} maxLength={12} autoComplete="off" className="rounded border p-3" defaultValue={defaultValues?.dni ?? ""} /></Field>
    <Field className="grid gap-1 font-semibold">{labelContent("Correo electrónico")}<input name="email" type="email" required maxLength={320} autoComplete="email" className="rounded border p-3" defaultValue={defaultValues?.email ?? ""} /></Field>
    <PasswordField name="password" label="Contraseña" autoComplete="new-password" help="Entre 6 y 128 caracteres. No compartas tu contraseña." defaultValue={defaultValues?.password} />
    <PasswordField name="confirmation" label="Confirmar contraseña" autoComplete="new-password" defaultValue={defaultValues?.confirmation} />
    <p className="text-sm">El correo debe verificarse antes de completar el perfil. Si ya existe un perfil asistido, la Oficina realizará la vinculación presencial.</p>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{homepageLayout && state.success && state.message && <Info size={16} aria-hidden="true" />}{state.message}</p>
    <button type="submit" disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{submitLabel}</button>
  </Form>;
}
