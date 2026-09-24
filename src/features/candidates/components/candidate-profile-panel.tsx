"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { activateProfileAction, archiveProfileAction, savePhoneAction, saveProfileAction } from "../profile-actions";
import { changeConsentAction } from "../consent-actions";
import { candidateProfileStatusLabels } from "../candidate-profile-status";

type State = { message: string; success: boolean };
type Category = { id: string; name: string; code: string };
type Profile = { id: string; display_name: string; locality: string | null; skills_experience_summary: string | null;
  availability: string | null; availability_detail: string | null; status: string; version: number; refresh_due_at: string | null };
type Policy = { version: string; policy_text: string; policy_hash: string };
function ActionMessage({ state }: { state: State }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) ref.current?.focus(); }, [state]);
  return <p ref={ref} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>;
}

export function CandidateProfilePanel({ profile, dni, address, phone, categories, selectedCategories,
  consent, cv, policy, accountVersion, cvMessage }: {
  profile: Profile; dni: string; address: string | null; phone: string | null;
  categories: Category[]; selectedCategories: string[];
  consent: { status: string; policy_version: string; recorded_at: string } | null;
  cv: { id: string; original_name_safe: string; byte_size: number } | null;
  policy: Policy; accountVersion: number; cvMessage?: string;
}) {
  const router = useRouter();
  const [saved, saveAction, saving] = useActionState(saveProfileAction, { message: "", success: false });
  const [contact, phoneAction, savingPhone] = useActionState(savePhoneAction, { message: "", success: false });
  const [activation, activateAction, activating] = useActionState(activateProfileAction, { message: "", success: false });
  const [consentState, consentAction, changingConsent] = useActionState(changeConsentAction, { message: "", success: false });
  const [archive, archiveAction, archiving] = useActionState(archiveProfileAction, { message: "", success: false });
  useEffect(() => { if (saved.success || contact.success || activation.success || consentState.success) router.refresh(); },
    [saved.success, contact.success, activation.success, consentState.success, router]);
  const field = "w-full rounded border border-slate-500 bg-white p-2";
  return <div className="space-y-8">
    <p role="status" className="rounded bg-blue-50 p-3">Estado del perfil: <strong>{candidateProfileStatusLabels[profile.status] ?? "En revisión"}</strong>. Vigencia: {profile.refresh_due_at ? new Date(profile.refresh_due_at).toLocaleDateString("es-AR") : "pendiente"}.</p>
    <form action={saveAction} className="grid gap-4 rounded border bg-white p-5" aria-busy={saving}>
      <h2 className="text-xl font-semibold">Datos laborales y personales</h2>
      <input type="hidden" name="version" value={profile.version} />
      <label className="grid gap-1">Nombre y apellido<input className={field} name="name" defaultValue={profile.display_name} required maxLength={200} /></label>
      <label className="grid gap-1">DNI <span className="text-sm">(oculto en pantalla)</span><input className={field} type="password" name="dni" defaultValue={dni} required inputMode="numeric" autoComplete="off" /></label>
      <label className="grid gap-1">Localidad laboral<input className={field} name="locality" defaultValue={profile.locality ?? ""} maxLength={150} required /></label>
      <label className="grid gap-1">Habilidades y experiencia<textarea className={field} name="summary" defaultValue={profile.skills_experience_summary ?? ""} maxLength={5000} rows={4} required /></label>
      <label className="grid gap-1">Disponibilidad<select className={field} name="availability" defaultValue={profile.availability ?? "available"}><option value="available">Disponible</option><option value="unavailable">No disponible</option></select></label>
      <label className="grid gap-1">Detalle de disponibilidad<input className={field} name="detail" defaultValue={profile.availability_detail ?? ""} maxLength={500} /></label>
      <label className="grid gap-1">Domicilio privado (opcional)<input className={field} name="address" defaultValue={address ?? ""} maxLength={500} autoComplete="street-address" /></label>
      <fieldset className="rounded border p-3"><legend className="font-semibold">Categorías laborales</legend><p className="mb-2 text-sm">Elegí una o varias.</p><div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.id} className="flex items-start gap-2"><input type="checkbox" name="categories" value={category.id} defaultChecked={selectedCategories.includes(category.id)} />{category.name}</label>)}</div></fieldset>
      <ActionMessage state={saved} /><button disabled={saving} className="rounded bg-blue-800 p-3 text-white">Guardar correcciones</button>
    </form>
    <form action={phoneAction} className="grid gap-3 rounded border bg-white p-5" aria-busy={savingPhone}>
      <h2 className="text-xl font-semibold">Contacto adicional</h2><input type="hidden" name="version" value={profile.version} />
      <label className="grid gap-1">Teléfono (opcional)<input className={field} name="phone" type="tel" defaultValue={phone ?? ""} maxLength={50} /></label>
      <ActionMessage state={contact} /><button disabled={savingPhone} className="rounded bg-blue-800 p-3 text-white">Guardar contacto</button>
    </form>
    <form action={consentAction} className="grid gap-3 rounded border bg-white p-5" aria-busy={changingConsent}>
      <h2 className="text-xl font-semibold">Consentimiento de prueba</h2>
      <p className="rounded bg-amber-50 p-3">{policy.policy_text} Esta versión <strong>{policy.version}</strong> no es texto municipal aprobado.</p>
      <p>Estado actual: {consent?.status === "accepted" ? "aceptado" : consent?.status === "withdrawn" ? "retirado" : "pendiente"}.</p>
      <input type="hidden" name="version" value={profile.version} />
      <label className="grid gap-1">Acción<select className={field} name="status" defaultValue={consent?.status === "accepted" ? "withdrawn" : "accepted"}><option value="accepted">Aceptar</option><option value="withdrawn">Retirar</option></select></label>
      <label className="flex gap-2"><input type="checkbox" name="confirmed" required />Confirmo esta decisión y entiendo sus efectos.</label>
      <ActionMessage state={consentState} /><button disabled={changingConsent} className="rounded bg-blue-800 p-3 text-white">Guardar consentimiento</button>
    </form>
    <section className="grid gap-3 rounded border bg-white p-5" aria-label="CV PDF">
      <h2 className="text-xl font-semibold">CV PDF</h2><p>{cv ? `CV vigente: ${cv.original_name_safe}` : "Todavía no hay un CV vigente."}</p>
      {cv && <a className="text-blue-800 underline" href={`/api/cv/${cv.id}`}>Descargar mi CV</a>}
      {cvMessage && <p role={cvMessage === "ok" ? "status" : "alert"}>{cvMessage === "ok" ? "CV guardado." : cvMessage === "conflict" ? "El perfil cambió. Recargá antes de reemplazar el CV." : "El PDF fue rechazado. Revisá formato, estructura y tamaño (máximo 5 MiB). El CV anterior sigue vigente."}</p>}
      <form method="post" action="/api/candidate/cv" encType="multipart/form-data" className="grid gap-3">
        <input type="hidden" name="candidateId" value={profile.id} /><input type="hidden" name="version" value={profile.version} />
        <label className="grid gap-1">Elegir PDF<input className={field} type="file" name="cv" accept=".pdf,application/pdf" required /></label>
        <button className="rounded bg-blue-800 p-3 text-white">Cargar o reemplazar CV</button>
      </form>
    </section>
    {profile.status !== "active" && <form action={activateAction} className="grid gap-3 rounded border bg-white p-5" aria-busy={activating}>
      <h2 className="text-xl font-semibold">Activar perfil</h2><p>Necesitás localidad, experiencia, al menos una categoría, disponibilidad, consentimiento vigente y CV PDF válido.</p>
      <input type="hidden" name="version" value={profile.version} /><ActionMessage state={activation} />
      <button disabled={activating} className="rounded bg-green-800 p-3 text-white">Activar perfil</button>
    </form>}
    <form action={archiveAction} className="grid gap-3 rounded border border-red-500 bg-red-50 p-5" aria-busy={archiving}>
      <h2 className="text-xl font-semibold text-red-900">Solicitar eliminación y archivar</h2>
      <p>El archivo es inmediato y bloquea tu acceso. La Oficina conserva el historial mientras se define la política de retención. Solo administración puede restaurar el perfil a borrador.</p>
      <input type="hidden" name="version" value={accountVersion} />
      <label className="flex gap-2"><input type="checkbox" name="confirmed" required />Confirmo que quiero archivar mi cuenta y perfil.</label>
      <ActionMessage state={archive} /><button disabled={archiving} className="rounded bg-red-800 p-3 text-white">Archivar ahora</button>
    </form>
  </div>;
}
