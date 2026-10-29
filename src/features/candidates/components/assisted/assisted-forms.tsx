"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveAssistedAction, assistedCommandAction } from "../../assisted-actions";
import { claimAssistedAction } from "../../claim-actions";
import type { DuplicateMatch } from "../../duplicate-service";
import type { AssistedConsentPolicy } from "../../assisted-service";
import { assistedFields, type AssistedInput } from "@/validation/duplicate-resolution";
import { DUPLICATE_DECISIONS } from "@/domain/catalogs";
import { candidatePhoneField, dniField } from "@/components/forms/identifier-fields";
import { CategoryMultiSelect } from "../category-multi-select";
const field = "w-full rounded border border-slate-500 bg-white p-2";
const button = "rounded bg-blue-800 p-3 text-white disabled:opacity-50";
const labels = { name: "Nombre y apellido", dni: "DNI", phone: "Teléfono", email: "Correo de contacto (opcional)",
  locality: "Localidad laboral", summary: "Habilidades y experiencia", availability: "Disponibilidad", detail: "Detalle de disponibilidad",
  address: "Domicilio privado (opcional)", categories: "Categorías laborales" };
function Message({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (text) ref.current?.focus(); }, [text]);
  return <p tabIndex={-1} ref={ref} role="status" aria-live="polite">{text}</p>;
}
export function AssistedProfileForm({ categories, candidateId, version, initial, creationPolicy }: {
  categories: { id: string; name: string }[]; candidateId?: string; version?: number; initial?: AssistedInput; creationPolicy?: AssistedConsentPolicy;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [decision, setDecision] = useState<string>("");
  const [reviewId, setReviewId] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(assistedFields.map((key) => [key,
      key === "categories" ? form.getAll(key) : form.get(key)]));
    const match = matches.find((m) => m.reviewId === reviewId);
    if (matches.length && (!decision || !match)) { setMessage("Seleccioná una coincidencia y una decisión."); return; }
    start(async () => {
      const result = await saveAssistedAction({ candidateId: candidateId ?? null,
        version: decision === "use_or_update_existing" ? match?.version : version ?? null, data,
        ...(!candidateId && creationPolicy ? { consent: { confirmed: form.get("consentConfirmed") === "on", policyVersion: creationPolicy.version, policyHash: creationPolicy.policy_hash } } : {}),
        resolution: matches.length ? { reviewId, decision, reason: form.get("reason"), confirmedFields: form.getAll("confirmedFields") } : null });
      setMessage(result.message);
      if (result.status === "duplicates") { setMatches(result.matches ?? []); setDecision(""); setReviewId(""); }
      if (result.status === "saved" && result.candidateReference) { router.push(`/admin/candidates/${result.candidateReference}`); router.refresh(); }
      if (result.status === "rejected") { setMatches([]); setDecision(""); setReviewId(""); }
    });
  }
  return <Form onSubmit={submit} requirements={[{ names: ["email", "phone"], message: "Ingresá al menos un contacto: correo o teléfono." },
    ...(!candidateId ? [{ names: ["categories"], message: "Seleccioná al menos una categoría laboral." }] : [])]} className="grid gap-4 rounded border bg-white p-5" aria-busy={pending}>
    <h2 className="text-xl font-semibold">{candidateId ? "Mantener perfil" : "Crear perfil asistido"}</h2>
    <p>La sesión identifica al administrador responsable. {candidateId ? "El CV puede incorporarse después." : "El alta exige datos laborales completos, disponibilidad y aceptación presencial. El perfil se guarda activo para evaluación interna; derivarlo requiere un CV válido."}</p>
    {(["name", "dni", "phone", "email", "locality", "summary", "detail", "address"] as const).map((key) =>
      <Field key={key} className="grid gap-1">{labels[key]}{key === "summary"
        ? <textarea className={field} name={key} defaultValue={initial?.[key] ?? ""} required={!candidateId} maxLength={5000} />
        : <input {...(key === "dni" ? dniField : key === "phone" ? candidatePhoneField : {})} className={field} name={key} defaultValue={initial?.[key] ?? ""} required={key === "name" || key === "dni" || !candidateId && key === "locality"} minLength={key === "name" ? 2 : undefined}
          type={key === "dni" ? "password" : key === "email" ? "email" : key === "phone" ? "tel" : "text"}
          autoComplete={key === "dni" ? "off" : undefined} maxLength={key === "name" ? 200 : key === "dni" ? 20 : key === "phone" ? 50 : key === "email" ? 320 : key === "locality" ? 150 : 500} />}</Field>)}
    <Field className="grid gap-1">Disponibilidad<select name="availability" required className={field} defaultValue={initial?.availability ?? "available"}>
      <option value="available">Disponible</option>{candidateId && <option value="unavailable">No disponible</option>}</select></Field>
    <fieldset className="grid gap-2 rounded border p-3"><legend>{labels.categories}</legend>
      {categories.length === 0 && <p>No hay categorías vigentes disponibles.</p>}
      <CategoryMultiSelect categories={categories} defaultSelected={initial?.categories ?? []} required={!candidateId} /></fieldset>
    {!candidateId && <fieldset className="grid gap-2 rounded border p-3"><legend className="font-semibold">Términos y condiciones</legend>
      <p>La persona acepta los términos y condiciones de la Oficina de Empleo para el uso de sus datos laborales y su comunicación a empresas solo después de una derivación municipal. La aceptación se registra una sola vez, al dar el alta, y no puede retirarse.</p>
      {creationPolicy ? <details><summary>Ver el texto de la versión {creationPolicy.version}</summary><p>{creationPolicy.policy_text}</p></details>
        : <p>No se pudo cargar el texto. Volvé a abrir esta página antes de crear el perfil.</p>}
      <Field className="flex gap-2"><input type="checkbox" name="consentConfirmed" required />Confirmo que la persona leyó y aceptó los términos y condiciones.</Field>
    </fieldset>}
    {matches.length > 0 && <fieldset className="grid gap-3 rounded border border-amber-600 p-4"><legend className="font-semibold">Resolver coincidencias</legend>
      <p>No se fusionan perfiles. Corregir y crear exige que el DNI y correo dejen de coincidir; usar el existente solo modifica los campos que marques.</p>
      <Field>Perfil coincidente<select className={field} value={reviewId} onChange={(e) => setReviewId(e.target.value)} required><option value="">Seleccionar</option>
        {matches.map((m) => <option key={m.reviewId} value={m.reviewId}>{m.name} · {m.basis === "dni" ? "DNI" : m.basis === "email" ? "correo" : "DNI y correo"}</option>)}</select></Field>
      <Field>Decisión<select className={field} value={decision} onChange={(e) => setDecision(e.target.value)} required><option value="">Seleccionar</option>
        <option value={DUPLICATE_DECISIONS[0]}>Usar o actualizar el perfil existente</option>
        {!candidateId && <option value={DUPLICATE_DECISIONS[1]}>Corregir falso positivo y crear por separado</option>}
        <option value={DUPLICATE_DECISIONS[2]}>Rechazar el alta</option></select></Field>
      <Field>Motivo de la decisión<textarea className={field} name="reason" required maxLength={1000} /></Field>
      {decision === "use_or_update_existing" && <fieldset><legend>Campos que autorizo actualizar</legend><p>Sin marcar campos, solo se utiliza el perfil existente.</p>
        {assistedFields.map((key) => <Field key={key} className="flex gap-2"><input type="checkbox" name="confirmedFields" value={key} />{labels[key]}</Field>)}</fieldset>}
    </fieldset>}
    <Message text={message} /><button className={button} disabled={pending || !candidateId && !creationPolicy}>{matches.length ? "Confirmar decisión" : candidateId ? "Guardar perfil asistido" : "Comprobar duplicados y guardar"}</button>
  </Form>;
}

export function AssistedCommands({ candidateId, version, status }: {
  candidateId: string; version: number; status: string;
}) {
  const router = useRouter(); const [pending, start] = useTransition(); const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    start(async () => { const result = await assistedCommandAction({ candidateId, version, command: form.get("command"), confirmed: true });
      setMessage(result.message); if (result.success) router.refresh(); });
  }
  return <section className="space-y-4 rounded border bg-white p-5"><h2 className="text-xl font-semibold">Activación</h2>
    <p>Los términos y condiciones se aceptan una sola vez, en el alta del perfil, y no pueden retirarse.</p>
    {status !== "active" && <Form onSubmit={submit} className="grid gap-3" aria-busy={pending}>
      <p>Para activar: localidad, experiencia, categorías, disponibilidad y contacto. El perfil asistido puede evaluarse sin PDF; derivarlo requiere un CV válido.</p>
      <input type="hidden" name="command" value="activate" />
      <button className={button} disabled={pending}>Activar para evaluación interna</button></Form>}
    <Message text={message} />
  </section>;
}
export function ClaimForm({ candidateId, version, requests }: { candidateId: string; version: number;
  requests: { accountId: string; email: string; verified: boolean }[] }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    start(async () => { const result = await claimAssistedAction({ candidateId, version, accountId: form.get("accountId"),
      dni: form.get("dni"), verifiedInPerson: form.get("verifiedInPerson") === "on", reason: form.get("reason") });
      setMessage(result.message); if (result.success) router.refresh(); });
  }
  return <Form onSubmit={submit} className="grid gap-3 rounded border bg-white p-5" aria-busy={pending}>
    <h2 className="text-xl font-semibold">Vincular cuenta presencialmente</h2>
    <p>Se exige correo verificado y una cuenta candidata sin otro perfil. La persona debe registrarse y abrir Mi perfil para dejar su solicitud pendiente.</p>
    {requests.length === 0 && <p>No hay solicitudes pendientes para este perfil.</p>}
    <Field>Cuenta solicitante<select className={field} name="accountId" required defaultValue=""><option value="">Seleccionar</option>
      {requests.map((r) => <option key={r.accountId} value={r.accountId} disabled={!r.verified}>{r.email} · {r.verified ? "verificado" : "sin verificar"}</option>)}</select></Field>
    <Field>DNI exhibido<input {...dniField} className={field} name="dni" type="password" autoComplete="off" inputMode="numeric" required /></Field>
    <Field>Motivo de vinculación (obligatorio si resuelve un conflicto)<textarea className={field} name="reason" maxLength={1000} /></Field>
    <Field className="flex gap-2"><input name="verifiedInPerson" type="checkbox" required />Comprobé presencialmente el DNI exhibido, sin guardar una copia.</Field>
    <Message text={message} /><button className={button} disabled={pending || requests.length === 0}>Vincular conservando historial</button>
  </Form>;
}
