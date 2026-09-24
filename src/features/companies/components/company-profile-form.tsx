"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { archiveCompanyAction, saveCompanyProfileAction } from "../company-actions";
import type { CompanyProfile } from "../service";

export function CompanyProfileForm({ profile, accountVersion }: { profile: CompanyProfile; accountVersion: number }) {
  const router = useRouter();
  const [saved, saveAction, saving] = useActionState(saveCompanyProfileAction, { message: "", success: false });
  const [archived, archiveAction, archiving] = useActionState(archiveCompanyAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (saved.message) feedback.current?.focus(); if (saved.success) router.refresh(); }, [saved, router]);
  const field = "rounded border border-slate-500 p-2";
  return <div className="space-y-8">
    <p role="status" className="rounded bg-blue-50 p-3">Estado: <strong>{profile.status === "active" ? "Activo" : "Incompleto"}</strong>. Las ofertas se publican solo después de aprobación municipal.</p>
    <form action={saveAction} className="grid gap-4 rounded border bg-white p-5" aria-busy={saving}>
      <input type="hidden" name="version" value={profile.version} />
      <label className="grid gap-1">Nombre de la empresa<input className={field} name="legalName" defaultValue={profile.legalName ?? ""} required maxLength={200} /></label>
      <label className="grid gap-1">CUIT<input className={field} name="cuit" type="password" defaultValue={profile.cuit ?? ""} required inputMode="numeric" maxLength={20} /></label>
      <label className="grid gap-1">Persona responsable<input className={field} name="responsibleName" defaultValue={profile.responsibleName ?? ""} required maxLength={200} /></label>
      <label className="grid gap-1">Correo de contacto<input className={field} name="email" type="email" defaultValue={profile.email ?? ""} maxLength={320} /></label>
      <label className="grid gap-1">Teléfono de contacto<input className={field} name="phone" type="tel" defaultValue={profile.phone ?? ""} maxLength={50} /></label>
      <label className="grid gap-1">Actividad<input className={field} name="activity" defaultValue={profile.activity ?? ""} required maxLength={500} /></label>
      <label className="grid gap-1">Localidad<input className={field} name="locality" defaultValue={profile.locality ?? ""} required maxLength={150} /></label>
      <p ref={feedback} tabIndex={-1} role={saved.success ? "status" : "alert"} aria-live="polite">{saved.message}</p>
      <button disabled={saving} className="rounded bg-blue-800 p-3 text-white">Guardar perfil</button>
    </form>
    <section className="rounded border-2 border-red-800 bg-red-50 p-5" aria-label="Archivo recuperable">
      <h2 className="text-xl font-semibold text-red-900">Archivar empresa</h2>
      <p>Se bloquea de inmediato el acceso privado, se archivan las ofertas abiertas y se revocan los permisos de derivación. Solo administración puede restaurar.</p>
      <form action={archiveAction} className="mt-3 grid gap-3" aria-busy={archiving}>
        <input type="hidden" name="accountVersion" value={accountVersion} />
        <label className="flex gap-2"><input type="checkbox" name="confirmed" required />Confirmo el archivo de mi empresa y sus ofertas.</label>
        <p role={archived.success ? "status" : "alert"} aria-live="polite">{archived.message}</p>
        <button disabled={archiving} className="rounded bg-red-800 p-3 text-white">Archivar empresa</button>
      </form>
    </section>
  </div>;
}
