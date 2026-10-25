"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { registerCompanyAction } from "../company-actions";
import { PasswordField } from "@/features/accounts/components/password-field";
import { companyPhoneField, cuitField } from "@/components/forms/identifier-fields";

export function CompanyRegistrationForm({ submitLabel = "Crear cuenta de empresa", homepageLayout = false }: { submitLabel?: string; homepageLayout?: boolean } = {}) {
  const [state, action, pending] = useActionState(registerCompanyAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  const field = "rounded border border-slate-500 p-3";
  const phoneLabel = homepageLayout ? "Teléfono de contacto" : "Teléfono de contacto (opcional)";
  return <Form action={action} result={state} requiredMarkers={homepageLayout ? "muted" : "always"} missingFieldMessages={homepageLayout ? "summary" : "inline"} preserveOnSuccess className="mt-6 grid gap-4" aria-busy={pending}>
    <Field className="grid gap-1">Nombre de la empresa<input className={field} name="legalName" required minLength={2} maxLength={200} /></Field>
    {homepageLayout ? <>
      <div data-company-field-row>
        <Field className="grid gap-1">Persona responsable<input className={field} name="responsibleName" required minLength={2} maxLength={200} /></Field>
        <Field className="grid gap-1">Correo electrónico<input className={field} name="email" type="email" required maxLength={320} autoComplete="email" /></Field>
      </div>
      <div data-company-field-row>
        <Field className="grid gap-1">CUIT<input {...cuitField} className={field} name="cuit" required inputMode="numeric" maxLength={20} /></Field>
        <Field className="grid gap-1">Actividad<input className={field} name="activity" required minLength={2} maxLength={500} /></Field>
      </div>
      <div data-company-field-row>
        <Field className="grid gap-1">Localidad<input className={field} name="locality" required minLength={2} maxLength={150} /></Field>
        <Field className="grid gap-1">{phoneLabel}<input {...companyPhoneField} className={field} name="phone" type="tel" maxLength={50} /></Field>
      </div>
    </> : <>
      <Field className="grid gap-1">CUIT<input {...cuitField} className={field} name="cuit" required inputMode="numeric" maxLength={20} /></Field>
      <Field className="grid gap-1">Persona responsable<input className={field} name="responsibleName" required minLength={2} maxLength={200} /></Field>
      <Field className="grid gap-1">Correo electrónico<input className={field} name="email" type="email" required maxLength={320} autoComplete="email" /></Field>
      <Field className="grid gap-1">Teléfono de contacto (opcional)<input {...companyPhoneField} className={field} name="phone" type="tel" maxLength={50} /></Field>
      <Field className="grid gap-1">Actividad<input className={field} name="activity" required minLength={2} maxLength={500} /></Field>
      <Field className="grid gap-1">Localidad<input className={field} name="locality" required minLength={2} maxLength={150} /></Field>
    </>}
    <PasswordField name="password" label="Contraseña" autoComplete="new-password" help="Entre 6 y 128 caracteres. No compartas tu contraseña." />
    <PasswordField name="confirmation" label="Confirmar contraseña" autoComplete="new-password" />
    <p className="text-sm">Verificá tu correo antes de ingresar. Cada oferta requiere revisión de la Oficina antes de publicarse.</p>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{homepageLayout && state.success && state.message && <Info size={16} aria-hidden="true" />}{state.message}</p>
    <button type="submit" disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{submitLabel}</button>
  </Form>;
}
