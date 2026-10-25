"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { activateProfileAction, savePhoneAction, saveProfileAction } from "../profile-actions";
import { changeConsentAction } from "../consent-actions";
import { candidateProfileStatusLabels } from "../candidate-profile-status";
import { displayLabel } from "@/domain/presentation/labels";
import { CvUploadForm } from "./cv-upload-form";
import { CandidatePhotoForm } from "./candidate-photo-form";
import styles from "./profile-panel.module.css";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions } from "@/components/ui/attachment";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { candidatePhoneField, dniField } from "@/components/forms/identifier-fields";

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
  consent, cv, cvReference, photo, photoCleanupPending, photoUnavailable, policy, cvMessage, cvReturnTo }: {
  profile: Profile; dni: string; address: string | null; phone: string | null;
  categories: Category[]; selectedCategories: string[];
  consent: { status: string; policy_version: string; recorded_at: string } | null;
  cv: { id: string; original_name_safe: string; byte_size: number } | null;
  cvReference?: string; policy: Policy; cvMessage?: string; cvReturnTo?: string;
  photo?: { id: string } | null; photoCleanupPending?: boolean; photoUnavailable?: boolean;
}) {
  const router = useRouter();
  const [saved, saveAction, saving] = useActionState(saveProfileAction, { message: "", success: false });
  const [contact, phoneAction, savingPhone] = useActionState(savePhoneAction, { message: "", success: false });
  const [activation, activateAction, activating] = useActionState(activateProfileAction, { message: "", success: false });
  const [consentState, consentAction, changingConsent] = useActionState(changeConsentAction, { message: "", success: false });
  useEffect(() => { if (saved.success || contact.success || activation.success || consentState.success) router.refresh(); },
    [saved.success, contact.success, activation.success, consentState.success, router]);
  const activatableState = ["draft", "needs_update", "unavailable", "consent_withdrawn"].includes(profile.status);
  const activationRequirements = [
    !profile.locality?.trim() && "Completá y guardá tu localidad laboral.",
    !profile.skills_experience_summary?.trim() && "Completá y guardá tus habilidades y experiencia.",
    selectedCategories.length === 0 && "Seleccioná y guardá al menos una categoría laboral.",
    profile.availability !== "available" && "Elegí Disponible y guardá tus datos laborales.",
    consent?.status !== "accepted" && "Aceptá y guardá el consentimiento para el tratamiento laboral de tus datos.",
    !cv && "Cargá un CV PDF válido.",
  ].filter(Boolean);
  const canActivate = activatableState && activationRequirements.length === 0;
  const statusTone = profile.status === "active" ? "active" : ["draft", "needs_update"].includes(profile.status) && activationRequirements.length > 0 ? "incomplete" : "neutral";
  const field = "municipal-control";
  return <div className={styles.panel}>
    <CandidatePhotoForm candidateId={profile.id} version={profile.version} photo={photo} name={profile.display_name} cleanupPending={photoCleanupPending} unavailable={photoUnavailable} />
    <section className={styles.section} aria-label="Activación del perfil">
      <p role="status" className={styles.status}>
        <span data-profile-status data-tone={statusTone} className={styles.statusDot} aria-hidden="true" />{profile.status === "active" ? <strong>Perfil activo</strong> : <>Estado del perfil: <strong>{displayLabel(candidateProfileStatusLabels, profile.status, "En revisión")}</strong></>}. Vigencia: {profile.refresh_due_at ? new Date(profile.refresh_due_at).toLocaleDateString("es-AR") : "pendiente"}.</p>
      {canActivate && <Form action={activateAction} result={activation} className="grid gap-3" aria-busy={activating}>
        <h2 className="text-xl font-semibold">Activar perfil</h2><p>Tu perfil cumple los requisitos guardados. Activá tu perfil para postularte y ser considerado por la Oficina de Empleo.</p>
        <input type="hidden" name="version" value={profile.version} /><ActionMessage state={activation} />
        <Button type="submit" disabled={activating}>Activar perfil</Button>
      </Form>}
      {activatableState && activationRequirements.length > 0 && <Empty className={styles.pending}>
        <EmptyHeader><h2 className="text-xl font-semibold">Antes de activar tu perfil</h2>
          <EmptyDescription>Completá estos pasos en las secciones de abajo. El botón aparecerá cuando los cambios estén guardados.</EmptyDescription></EmptyHeader>
        <ul className="list-disc space-y-1 pl-5">{activationRequirements.map(requirement => <li key={String(requirement)}>{requirement}</li>)}</ul>
      </Empty>}
    </section>
    <section className={styles.section} aria-label="Datos laborales y personales">
    <Form action={saveAction} result={saved} data-profile-details className={styles.details} aria-busy={saving}>
      <h2 className="text-xl font-semibold">Datos laborales y personales</h2>
      <input type="hidden" name="version" value={profile.version} />
      <Field className="grid gap-1">Nombre y apellido<input className={field} name="name" defaultValue={profile.display_name} required minLength={2} maxLength={200} /></Field>
      <Field className="grid gap-1">DNI <span className="text-sm">(oculto en pantalla)</span><input {...dniField} className={field} type="password" name="dni" defaultValue={dni} required inputMode="numeric" autoComplete="off" /></Field>
      <Field className="grid gap-1">Localidad laboral<input className={field} name="locality" defaultValue={profile.locality ?? ""} maxLength={150} required /></Field>
      <Field className="grid gap-1">Habilidades y experiencia<textarea className={field} name="summary" defaultValue={profile.skills_experience_summary ?? ""} maxLength={5000} rows={4} required /></Field>
      <Field className="grid gap-1">Disponibilidad<select className={field} name="availability" required defaultValue={profile.availability ?? "available"}><option value="available">Disponible</option><option value="unavailable">No disponible</option></select></Field>
      <Field className="grid gap-1">Detalle de disponibilidad<input className={field} name="detail" defaultValue={profile.availability_detail ?? ""} maxLength={500} /></Field>
      <Field className="grid gap-1">Domicilio privado (opcional)<input className={field} name="address" defaultValue={address ?? ""} maxLength={500} autoComplete="street-address" /></Field>
      <fieldset className={styles.group}><legend className="font-semibold">Categorías laborales</legend><p className="mb-2 text-sm">Elegí una o varias.</p>{categories.length === 0 && <Empty className={styles.empty}><EmptyHeader>
        <EmptyTitle>No hay categorías laborales disponibles.</EmptyTitle><EmptyDescription>El catálogo no está disponible. Volvé a intentar más tarde o consultá a la Oficina de Empleo.</EmptyDescription>
      </EmptyHeader></Empty>}<div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <Field key={category.id} className={styles.choice}><input type="checkbox" name="categories" value={category.id} defaultChecked={selectedCategories.includes(category.id)} />{category.name}</Field>)}</div></fieldset>
      <ActionMessage state={saved} /><Button type="submit" disabled={saving}>Guardar correcciones</Button>
    </Form>
    <Form action={phoneAction} result={contact} className="grid gap-3" aria-label="Guardar teléfono opcional" aria-busy={savingPhone}>
      <input type="hidden" name="version" value={profile.version} />
      <Field className="grid gap-1">Teléfono (opcional)<input {...candidatePhoneField} className={field} name="phone" type="tel" defaultValue={phone ?? ""} maxLength={50} /></Field>
      <ActionMessage state={contact} /><Button type="submit" disabled={savingPhone}>Guardar teléfono</Button>
    </Form>
    </section>
    <section className={styles.section} aria-label="CV PDF">
      <h2 className="text-xl font-semibold">CV PDF</h2>
      {cv && cvReference ? <Attachment className={styles.attachment}>
        <AttachmentMedia><FileText aria-hidden="true" /></AttachmentMedia>
        <AttachmentContent><AttachmentTitle title={cv.original_name_safe}>{cv.original_name_safe}</AttachmentTitle>
          <AttachmentDescription>CV vigente · PDF · {new Intl.NumberFormat("es-AR").format(cv.byte_size)} bytes</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions><a className={styles.download} href={`/api/cv/${cvReference}`}>Descargar mi CV</a></AttachmentActions>
      </Attachment> : <Empty className={styles.empty}><EmptyHeader><EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Todavía no hay un CV vigente.</EmptyTitle><EmptyDescription>Cargá un PDF válido para completar este requisito del perfil.</EmptyDescription>
      </EmptyHeader></Empty>}
      {cvMessage && <p role={cvMessage === "ok" ? "status" : "alert"}>{cvMessage === "ok" ? "CV guardado." : cvMessage === "conflict" ? "El perfil cambió. Recargá antes de reemplazar el CV." : "El PDF fue rechazado. Revisá formato, estructura y tamaño (máximo 5 MiB). El CV anterior sigue vigente."}</p>}
      <CvUploadForm candidateId={profile.id} version={profile.version} returnTo={cvReturnTo} />
    </section>
    <Form action={consentAction} result={consentState} className={styles.section} aria-busy={changingConsent}>
      <h2 className="text-xl font-semibold">Consentimiento de prueba</h2>
      <p>Al aceptar, autorizás a la Oficina de Empleo a registrar y usar tus datos para acompañar tu búsqueda laboral y gestionar futuras derivaciones. Es un consentimiento general, no una aceptación por cada oferta.</p>
      <p>Una empresa solo puede ver tu perfil laboral, tus contactos vigentes y el CV asociado a su derivación cuando la Oficina de Empleo te deriva a una oferta de esa empresa y el permiso sigue vigente. No puede ver tu DNI, domicilio ni notas internas, ni consultar el padrón de candidatos.</p>
      <p>Si la Oficina confirma una contratación, incluso tardía, en una de tus participaciones, tu consentimiento global vigente se retira automáticamente y se revocan los accesos de todas las empresas que dependan de él. No se cambian tus otras participaciones ni sus resultados y se conserva el historial.</p>
      <p>Las empresas a las que la Oficina ya te haya derivado podrán seguir viendo únicamente tu nombre para identificar esas derivaciones e informar sus resultados, incluso cuando termine el permiso. Esto no les devuelve acceso a tu perfil, contactos, foto ni CV.</p>
      <p>Corregir un resultado no restablece el consentimiento. Para otorgarlo de nuevo tenés que volver a aceptarlo expresamente desde este formulario; eso no reabre participaciones ni devuelve accesos revocados.</p>
      <p>También podés retirarlo manualmente: se bloquean nuevas derivaciones, se revocan los accesos empresariales y se cierran como retiradas tus participaciones abiertas. Los resultados finales y el historial se conservan.</p>
      <details className={styles.group}>
        <summary className={styles.policySummary}>Ver política de consentimiento</summary>
        <p className="mt-3">{policy.policy_text} Esta versión <strong>{policy.version}</strong> no es texto municipal aprobado.</p>
      </details>
      <p>Estado actual: {consent?.status === "accepted" ? "aceptado" : consent?.status === "withdrawn" ? "retirado" : "pendiente"}.</p>
      <input type="hidden" name="version" value={profile.version} />
      <Field className="grid gap-1">Acción<select className={field} name="status" required defaultValue={consent?.status === "accepted" ? "withdrawn" : "accepted"}><option value="accepted">Aceptar</option><option value="withdrawn">Retirar</option></select></Field>
      <Field className={styles.choice}><input type="checkbox" name="confirmed" required />Confirmo esta decisión y entiendo sus efectos.</Field>
      <ActionMessage state={consentState} /><Button type="submit" disabled={changingConsent}>Guardar consentimiento</Button>
    </Form>
  </div>;
}
