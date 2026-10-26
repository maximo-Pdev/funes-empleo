"use client";
import { companyProfileStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveCompanyProfileAction } from "../company-actions";
import type { CompanyProfile } from "../service";
import { companyPhoneField, cuitField } from "@/components/forms/identifier-fields";
import { IdentifierField } from "@/components/forms/identifier-field";

export function CompanyProfileForm({ profile }: { profile: CompanyProfile }) {
  const router = useRouter();
  const [saved, saveAction, saving] = useActionState(saveCompanyProfileAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (saved.message) feedback.current?.focus(); if (saved.success) router.refresh(); }, [saved, router]);
  const field = "rounded border border-slate-500 p-2";
  return <div className="space-y-8">
    <p role="status" className="rounded bg-blue-50 p-3">Estado: <strong>{displayLabel(companyProfileStatusLabels, profile.status)}</strong>. Las ofertas se publican solo después de aprobación municipal.</p>
    <Form action={saveAction} result={saved} requirements={[{ names: ["email", "phone"], message: "Ingresá un correo o un teléfono de contacto." }]} className="grid gap-4 rounded border bg-white p-5" aria-busy={saving}>
      <input type="hidden" name="version" value={profile.version} />
      <Field className="grid gap-1">Nombre de la empresa<input className={field} name="legalName" defaultValue={profile.legalName ?? ""} required minLength={2} maxLength={200} /></Field>
      <IdentifierField label="CUIT" {...cuitField} className={field} name="cuit" defaultValue={profile.cuit ?? ""} required inputMode="numeric" maxLength={20} />
      <Field className="grid gap-1">Persona responsable<input className={field} name="responsibleName" defaultValue={profile.responsibleName ?? ""} required minLength={2} maxLength={200} /></Field>
      <Field className="grid gap-1">Correo de contacto<input className={field} name="email" type="email" defaultValue={profile.email ?? ""} maxLength={320} /></Field>
      <Field className="grid gap-1">Teléfono de contacto<input {...companyPhoneField} className={field} name="phone" type="tel" defaultValue={profile.phone ?? ""} maxLength={50} /></Field>
      <Field className="grid gap-1">Actividad<input className={field} name="activity" defaultValue={profile.activity ?? ""} required minLength={2} maxLength={500} /></Field>
      <Field className="grid gap-1">Localidad<input className={field} name="locality" defaultValue={profile.locality ?? ""} required minLength={2} maxLength={150} /></Field>
      <p ref={feedback} tabIndex={-1} role={saved.success ? "status" : "alert"} aria-live="polite">{saved.message}</p>
      <button disabled={saving} className="rounded bg-blue-800 p-3 text-white">Guardar perfil</button>
    </Form>
  </div>;
}
