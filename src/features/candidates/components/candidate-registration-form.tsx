"use client";
import { useActionState, useEffect, useRef } from "react";
import { registerCandidateAction } from "../registration-actions";
import { PasswordField } from "@/features/accounts/components/password-field";

export function CandidateRegistrationForm({ submitLabel = "Crear cuenta candidata", homepageLayout = false }: { submitLabel?: string; homepageLayout?: boolean } = {}) {
  const [state, action, pending] = useActionState(registerCandidateAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  const labelContent = (text: string) => homepageLayout ? <span>{text}</span> : text;
  return <form action={action} className="mt-6 grid gap-4" aria-busy={pending}>
    <label className="grid gap-1 font-semibold">{labelContent("Nombre y apellido")}<input name="name" required maxLength={200} autoComplete="name" className="rounded border p-3" /></label>
    <label className="grid gap-1 font-semibold">{labelContent("DNI")}<input name="dni" required inputMode="numeric" minLength={7} maxLength={12} autoComplete="off" className="rounded border p-3" /></label>
    <label className="grid gap-1 font-semibold">{labelContent("Correo electrónico")}<input name="email" type="email" required maxLength={320} autoComplete="email" className="rounded border p-3" /></label>
    <PasswordField name="password" label="Contraseña" autoComplete="new-password" help="Entre 6 y 128 caracteres." />
    <PasswordField name="confirmation" label="Confirmar contraseña" autoComplete="new-password" />
    <p className="text-sm">El correo debe verificarse antes de completar el perfil. Si ya existe un perfil asistido, la Oficina realizará la vinculación presencial.</p>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button type="submit" disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{submitLabel}</button>
  </form>;
}
