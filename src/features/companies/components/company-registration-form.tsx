"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { registerCompanyAction } from "../company-actions";
import { PasswordField } from "@/features/accounts/components/password-field";
import { companyPhoneField, cuitField } from "@/components/forms/identifier-fields";
import { LocalityCombobox } from "./locality-combobox";
import { TermsAcceptanceField } from "@/features/accounts/components/terms-acceptance-field";

export function CompanyRegistrationForm({ submitLabel = "Crear cuenta de empresa", homepageLayout = false, onSent, defaultValues }: { submitLabel?: string; homepageLayout?: boolean; onSent?: (result: { email: string; message: string }) => void; defaultValues?: Record<string, string> } = {}) {
  const [state, action, pending] = useActionState(registerCompanyAction, { message: "", success: false });
  const [submittedEmail, setSubmittedEmail] = useState("");
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  useEffect(() => { if (state.success && submittedEmail) onSent?.({ email: submittedEmail, message: state.message }); }, [state, submittedEmail, onSent]);
  const field = "rounded border border-slate-500 p-3";
  const phoneLabel = homepageLayout ? "Teléfono de contacto" : "Teléfono de contacto (opcional)";
  return <Form action={action} result={state} requiredMarkers={homepageLayout ? "muted" : "always"} missingFieldMessages={homepageLayout ? "summary" : "inline"} preserveOnSuccess className="mt-6 grid gap-4" aria-busy={pending}
    onSubmitCapture={event => setSubmittedEmail(String(new FormData(event.currentTarget).get("email") ?? ""))}>
    <Field className="grid gap-1">Nombre de la empresa<input className={field} name="legalName" required minLength={2} maxLength={200} defaultValue={defaultValues?.legalName ?? ""} /></Field>
    {homepageLayout ? <>
      <div data-company-field-row>
        <Field className="grid gap-1">Persona responsable<input className={field} name="responsibleName" required minLength={2} maxLength={200} defaultValue={defaultValues?.responsibleName ?? ""} /></Field>
        <Field className="grid gap-1">Correo electrónico<input className={field} name="email" type="email" required maxLength={320} autoComplete="email" defaultValue={defaultValues?.email ?? ""} /></Field>
      </div>
      <div data-company-field-row>
        <Field className="grid gap-1">CUIT<input {...cuitField} className={field} name="cuit" required inputMode="numeric" maxLength={20} defaultValue={defaultValues?.cuit ?? ""} /></Field>
        <Field className="grid gap-1">Actividad<input className={field} name="activity" required minLength={2} maxLength={500} defaultValue={defaultValues?.activity ?? ""} /></Field>
      </div>
      <div data-company-field-row>
        <LocalityCombobox label="Localidad" name="locality" aria-label="Localidad" defaultValue={defaultValues?.locality ?? ""} />
        <Field className="grid gap-1">{phoneLabel}<input {...companyPhoneField} className={field} name="phone" type="tel" maxLength={50} defaultValue={defaultValues?.phone ?? ""} /></Field>
      </div>
    </> : <>
      <Field className="grid gap-1">CUIT<input {...cuitField} className={field} name="cuit" required inputMode="numeric" maxLength={20} defaultValue={defaultValues?.cuit ?? ""} /></Field>
      <Field className="grid gap-1">Persona responsable<input className={field} name="responsibleName" required minLength={2} maxLength={200} defaultValue={defaultValues?.responsibleName ?? ""} /></Field>
      <Field className="grid gap-1">Correo electrónico<input className={field} name="email" type="email" required maxLength={320} autoComplete="email" defaultValue={defaultValues?.email ?? ""} /></Field>
      <Field className="grid gap-1">Teléfono de contacto (opcional)<input {...companyPhoneField} className={field} name="phone" type="tel" maxLength={50} defaultValue={defaultValues?.phone ?? ""} /></Field>
      <Field className="grid gap-1">Actividad<input className={field} name="activity" required minLength={2} maxLength={500} defaultValue={defaultValues?.activity ?? ""} /></Field>
      <LocalityCombobox label="Localidad" name="locality" aria-label="Localidad" defaultValue={defaultValues?.locality ?? ""} />
    </>}
    <PasswordField name="password" label="Contraseña" autoComplete="new-password" help="Entre 6 y 128 caracteres. No compartas tu contraseña." defaultValue={defaultValues?.password} />
    <PasswordField name="confirmation" label="Confirmar contraseña" autoComplete="new-password" defaultValue={defaultValues?.confirmation} />
    <p className="text-sm">Verificá tu correo antes de ingresar. Cada oferta requiere revisión de la Oficina antes de publicarse.</p>
    <TermsAcceptanceField />
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{homepageLayout && state.success && state.message && <Info size={16} aria-hidden="true" />}{state.message}</p>
    <button type="submit" disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{submitLabel}</button>
  </Form>;
}
