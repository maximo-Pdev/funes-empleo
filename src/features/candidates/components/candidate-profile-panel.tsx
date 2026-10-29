"use client";
import { formatFunesDate } from "@/lib/time/presentation";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { activateProfileAction, savePhoneAction, saveProfileAction } from "../profile-actions";

import { candidateProfileStatusLabels } from "../candidate-profile-status";
import { displayLabel } from "@/domain/presentation/labels";
import { candidateProfileStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { CvUploadForm } from "./cv-upload-form";
import { CandidatePhotoForm } from "./candidate-photo-form";
import styles from "./profile-panel.module.css";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions } from "@/components/ui/attachment";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { candidatePhoneField, dniField } from "@/components/forms/identifier-fields";
import { LocalityCombobox } from "@/features/companies/components/locality-combobox";
import { CategoryMultiSelect } from "./category-multi-select";
import { IdentifierField } from "@/components/forms/identifier-field";

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
  consent, cv, cvReference, photo, photoCleanupPending, photoUnavailable, cvMessage, cvReturnTo, privacyHref = "/account?section=cuenta" }: {
  profile: Profile; dni: string; address: string | null; phone: string | null;
  categories: Category[]; selectedCategories: string[];
  consent: { status: string; policy_version: string; recorded_at: string } | null;
  cv: { id: string; original_name_safe: string; byte_size: number } | null;
  cvReference?: string; policy?: Policy; cvMessage?: string; cvReturnTo?: string; privacyHref?: string;
  photo?: { id: string } | null; photoCleanupPending?: boolean; photoUnavailable?: boolean;
}) {
  const router = useRouter();
  const [saved, saveAction, saving] = useActionState(saveProfileAction, { message: "", success: false });
  const [contact, phoneAction, savingPhone] = useActionState(savePhoneAction, { message: "", success: false });
  const [activation, activateAction, activating] = useActionState(activateProfileAction, { message: "", success: false });

  useEffect(() => { if (saved.success || contact.success || activation.success) router.refresh(); },
    [saved.success, contact.success, activation.success, router]);
  const activatableState = ["draft", "needs_update", "unavailable", "consent_withdrawn"].includes(profile.status);
  const activationRequirements = [
    !profile.locality?.trim() && "Completá y guardá tu localidad laboral.",
    !profile.skills_experience_summary?.trim() && "Completá y guardá tus habilidades y experiencia.",
    selectedCategories.length === 0 && "Seleccioná y guardá al menos una categoría laboral.",
    profile.availability !== "available" && "Elegí Disponible y guardá tus datos laborales.",
    consent?.status !== "accepted" && "Gestioná el permiso para el tratamiento laboral de tus datos en Cuenta > Privacidad.",
    !cv && "Cargá un CV PDF válido.",
  ].filter(Boolean);
  const canActivate = activatableState && activationRequirements.length === 0;
  const tone = statusTone(candidateProfileStatusTones, profile.status);
  const field = "municipal-control";
  return <div className={styles.panel}>
    <CandidatePhotoForm candidateId={profile.id} version={profile.version} photo={photo} name={profile.display_name} cleanupPending={photoCleanupPending} unavailable={photoUnavailable} />
    <section className={styles.section} aria-label="Activación del perfil">
      <p role="status" className={styles.status}>
        Estado del perfil <Badge variant="status" tone={tone} data-profile-status data-tone={tone}>{displayLabel(candidateProfileStatusLabels, profile.status, "En revisión")}</Badge>. Vigencia: {profile.refresh_due_at ? formatFunesDate(profile.refresh_due_at) : "pendiente"}.</p>
      {canActivate && <Form action={activateAction} result={activation} className="grid gap-3" aria-busy={activating}>
        <h2 className="text-xl font-semibold">Activar perfil</h2><p>Tu perfil cumple los requisitos guardados. Activá tu perfil para postularte y ser considerado por la Oficina de Empleo.</p>
        <input type="hidden" name="version" value={profile.version} /><ActionMessage state={activation} />
        <Button type="submit" disabled={activating}>Activar perfil</Button>
      </Form>}
      {activatableState && activationRequirements.length > 0 && <Empty className={styles.pending}>
        <EmptyHeader><h2 className="text-xl font-semibold">Antes de activar tu perfil</h2>
          <EmptyDescription>Completá estos pasos en Perfil y Cuenta, sección Privacidad. El botón aparecerá cuando los cambios estén guardados.</EmptyDescription></EmptyHeader>
        <ul className="list-disc space-y-1 pl-5">{activationRequirements.map(requirement => <li key={String(requirement)}>{requirement}</li>)}</ul>
      </Empty>}
      {consent?.status !== "accepted" && <Link href={privacyHref} className="underline underline-offset-4">Gestionar privacidad en Cuenta</Link>}
    </section>
    <section className={styles.section} aria-label="Datos laborales y personales">
    <Form action={saveAction} result={saved} data-profile-details className={styles.details} aria-busy={saving}>
      <h2 className="text-xl font-semibold">Datos laborales y personales</h2>
      <input type="hidden" name="version" value={profile.version} />
      <Field className="grid gap-1">Nombre y apellido<input className={field} name="name" defaultValue={profile.display_name} required minLength={2} maxLength={200} /></Field>
      <IdentifierField label="DNI" {...dniField} className={field} name="dni" defaultValue={dni} required inputMode="numeric" autoComplete="off" />
      <LocalityCombobox name="locality" label="Localidad laboral" aria-label="Localidad laboral" defaultValue={profile.locality ?? ""} required />
      <Field className="grid gap-1">Habilidades y experiencia<textarea className={field} name="summary" defaultValue={profile.skills_experience_summary ?? ""} maxLength={5000} rows={4} required /></Field>
      <Field className="grid gap-1">Disponibilidad<select className={field} name="availability" required defaultValue={profile.availability ?? "available"}><option value="available">Disponible</option><option value="unavailable">No disponible</option></select></Field>
      <Field className="grid gap-1">Detalle de disponibilidad<input className={field} name="detail" defaultValue={profile.availability_detail ?? ""} maxLength={500} /></Field>
      <Field className="grid gap-1">Domicilio privado (opcional)<input className={field} name="address" defaultValue={address ?? ""} maxLength={500} autoComplete="street-address" /></Field>
      <fieldset className={styles.group}><legend className="font-semibold">Categorías laborales</legend><p className="mb-2 text-sm">Elegí una o varias.</p>{categories.length === 0 && <Empty className={styles.empty}><EmptyHeader>
        <EmptyTitle>No hay categorías laborales disponibles.</EmptyTitle><EmptyDescription>El catálogo no está disponible. Volvé a intentar más tarde o consultá a la Oficina de Empleo.</EmptyDescription>
      </EmptyHeader></Empty>}<CategoryMultiSelect categories={categories} defaultSelected={selectedCategories} /></fieldset>
      <ActionMessage state={saved} /><Button type="submit" disabled={saving}>Guardar correcciones</Button>
    </Form>
    </section>
    <section className={styles.section} aria-label="Contacto">
    <h2 className="text-xl font-semibold">Contacto</h2>
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
        <AttachmentActions><a className={styles.download} href={`/api/cv/${cvReference}`} target="_blank" rel="noopener noreferrer">Abrir mi CV en otra pestaña</a></AttachmentActions>
      </Attachment> : <Empty className={styles.empty}><EmptyHeader><EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Todavía no hay un CV vigente.</EmptyTitle><EmptyDescription>Cargá un PDF válido para completar este requisito del perfil.</EmptyDescription>
      </EmptyHeader></Empty>}
      {cvMessage && <p role={cvMessage === "ok" ? "status" : "alert"}>{cvMessage === "ok" ? "CV guardado." : cvMessage === "conflict" ? "El perfil cambió. Recargá antes de reemplazar el CV." : "El archivo de CV fue rechazado. Usá PDF, JPG/JPEG o PNG de hasta 5 MiB. El CV anterior sigue vigente."}</p>}
      <CvUploadForm candidateId={profile.id} version={profile.version} returnTo={cvReturnTo} />
    </section>

  </div>;
}
