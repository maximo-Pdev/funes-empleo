"use client";
import { useActionState, useEffect, useRef } from "react";
import { registerCompanyAction } from "../company-actions";
import { PasswordField } from "@/features/accounts/components/password-field";

export function CompanyRegistrationForm({ submitLabel = "Crear cuenta de empresa", homepageLayout = false }: { submitLabel?: string; homepageLayout?: boolean } = {}) {
  const [state, action, pending] = useActionState(registerCompanyAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  const field = "rounded border border-slate-500 p-3";
  const labelContent = (text: string) => homepageLayout ? <span>{text}</span> : text;
  const phoneField = <label className="grid gap-1">{labelContent(homepageLayout ? "Teléfono de contacto" : "Teléfono de contacto (opcional)")}<input className={field} name="phone" type="tel" maxLength={50} /></label>;
  const activityField = <label className="grid gap-1">{labelContent("Actividad")}<input className={field} name="activity" required maxLength={500} /></label>;
  const cuitField = <label className="grid gap-1">{labelContent("CUIT")}<input className={field} name="cuit" required inputMode="numeric" maxLength={20} /></label>;
  const localityField = <label className="grid gap-1">{labelContent("Localidad")}<input className={field} name="locality" required maxLength={150} /></label>;
  const responsibleField = <label className="grid gap-1">{labelContent("Persona responsable")}<input className={field} name="responsibleName" required maxLength={200} /></label>;
  const emailField = <label className="grid gap-1">{labelContent("Correo electrónico")}<input className={field} name="email" type="email" required maxLength={320} autoComplete="email" /></label>;
  return <form action={action} className="mt-6 grid gap-4" aria-busy={pending}>
    <label className="grid gap-1">{labelContent("Nombre de la empresa")}<input className={field} name="legalName" required maxLength={200} /></label>
    {!homepageLayout && cuitField}
    {homepageLayout ? <div data-company-field-row>{responsibleField}{emailField}</div> : <>{responsibleField}{emailField}</>}
    {homepageLayout ? <>
      <div data-company-field-row>{cuitField}{activityField}</div>
      <div data-company-field-row>{localityField}{phoneField}</div>
    </> : <>{phoneField}{activityField}{localityField}</>}
    <PasswordField name="password" label="Contraseña" autoComplete="new-password" help="Entre 6 y 128 caracteres." />
    <PasswordField name="confirmation" label="Confirmar contraseña" autoComplete="new-password" />
    <p className="text-sm">Verificá tu correo antes de ingresar. Cada oferta requiere revisión de la Oficina antes de publicarse.</p>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button type="submit" disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{submitLabel}</button>
  </form>;
}
