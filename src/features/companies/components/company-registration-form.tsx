"use client";
import { useActionState, useEffect, useRef } from "react";
import { registerCompanyAction } from "../company-actions";

export function CompanyRegistrationForm() {
  const [state, action, pending] = useActionState(registerCompanyAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  const field = "rounded border border-slate-500 p-3";
  return <form action={action} className="mt-6 grid gap-4" aria-busy={pending}>
    <label className="grid gap-1">Nombre de la empresa<input className={field} name="legalName" required maxLength={200} /></label>
    <label className="grid gap-1">CUIT<input className={field} name="cuit" required inputMode="numeric" maxLength={20} /></label>
    <label className="grid gap-1">Persona responsable<input className={field} name="responsibleName" required maxLength={200} /></label>
    <label className="grid gap-1">Correo electrónico<input className={field} name="email" type="email" required maxLength={320} autoComplete="email" /></label>
    <label className="grid gap-1">Teléfono de contacto (opcional)<input className={field} name="phone" type="tel" maxLength={50} /></label>
    <label className="grid gap-1">Actividad<input className={field} name="activity" required maxLength={500} /></label>
    <label className="grid gap-1">Localidad<input className={field} name="locality" required maxLength={150} /></label>
    <label className="grid gap-1">Contraseña<input className={field} name="password" type="password" required minLength={6} maxLength={128} autoComplete="new-password" /></label>
    <p className="text-sm">Verificá tu correo antes de ingresar. Cada oferta requiere revisión de la Oficina antes de publicarse.</p>
    <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">Crear cuenta de empresa</button>
  </form>;
}
