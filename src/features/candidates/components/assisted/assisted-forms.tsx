"use client";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveAssistedAction, assistedCommandAction } from "../../assisted-actions";
import { claimAssistedAction } from "../../claim-actions";
import type { DuplicateMatch } from "../../duplicate-service";
import { assistedFields, type AssistedInput } from "@/validation/duplicate-resolution";
import { DUPLICATE_DECISIONS } from "@/domain/catalogs";
const field = "w-full rounded border border-slate-500 bg-white p-2";
const button = "rounded bg-blue-800 p-3 text-white disabled:opacity-50";
const labels = { name: "Nombre y apellido", dni: "DNI", phone: "Teléfono", email: "Correo de contacto (opcional)",
  locality: "Localidad laboral", summary: "Habilidades y experiencia", availability: "Disponibilidad", detail: "Detalle de disponibilidad",
  address: "Domicilio privado (opcional)", categories: "Categorías laborales", interests: "Intereses laborales" };
function Message({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (text) ref.current?.focus(); }, [text]);
  return <p tabIndex={-1} ref={ref} role="status" aria-live="polite">{text}</p>;
}
export function AssistedProfileForm({ categories, candidateId, version, initial }: {
  categories: { id: string; name: string }[]; candidateId?: string; version?: number; initial?: AssistedInput;
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
      key === "categories" || key === "interests" ? form.getAll(key) : form.get(key)]));
    const match = matches.find((m) => m.reviewId === reviewId);
    if (matches.length && (!decision || !match)) { setMessage("Seleccioná una coincidencia y una decisión."); return; }
    start(async () => {
      const result = await saveAssistedAction({ candidateId: candidateId ?? null,
        version: decision === "use_or_update_existing" ? match?.version : version ?? null, data,
        resolution: matches.length ? { reviewId, decision, reason: form.get("reason"), confirmedFields: form.getAll("confirmedFields") } : null });
      setMessage(result.message);
      if (result.status === "duplicates") { setMatches(result.matches ?? []); setDecision(""); setReviewId(""); }
      if (result.status === "saved" && result.candidateId) { router.push(`/admin/candidates/assisted/${result.candidateId}`); router.refresh(); }
      if (result.status === "rejected") { setMatches([]); setDecision(""); setReviewId(""); }
    });
  }
  return <form onSubmit={submit} className="grid gap-4 rounded border bg-white p-5" aria-busy={pending}>
    <h2 className="text-xl font-semibold">{candidateId ? "Mantener perfil" : "Crear perfil asistido"}</h2>
    <p>La sesión identifica al administrador responsable. Para comenzar se requieren nombre, DNI y al menos un contacto; el CV puede incorporarse después.</p>
    {(["name", "dni", "phone", "email", "locality", "summary", "detail", "address"] as const).map((key) =>
      <label key={key} className="grid gap-1">{labels[key]}{key === "summary"
        ? <textarea className={field} name={key} defaultValue={initial?.[key] ?? ""} maxLength={5000} />
        : <input className={field} name={key} defaultValue={initial?.[key] ?? ""} required={key === "name" || key === "dni"}
          type={key === "dni" ? "password" : key === "email" ? "email" : key === "phone" ? "tel" : "text"}
          autoComplete={key === "dni" ? "off" : undefined} maxLength={key === "name" ? 200 : key === "dni" ? 20 : key === "phone" ? 50 : key === "email" ? 320 : key === "locality" ? 150 : 500} />}</label>)}
    <label className="grid gap-1">Disponibilidad<select name="availability" className={field} defaultValue={initial?.availability ?? "available"}>
      <option value="available">Disponible</option><option value="unavailable">No disponible</option></select></label>
    {(["categories", "interests"] as const).map((kind) => <fieldset key={kind} className="rounded border p-3"><legend>{labels[kind]}</legend>
      {categories.length === 0 && <p>No hay categorías vigentes disponibles.</p>}
      <div className="grid gap-2 sm:grid-cols-2">{categories.map((c) => <label key={c.id} className="flex gap-2"><input name={kind} type="checkbox" value={c.id}
        defaultChecked={initial?.[kind].includes(c.id)} />{kind === "interests" ? `Interés: ${c.name}` : c.name}</label>)}</div></fieldset>)}
    {matches.length > 0 && <fieldset className="grid gap-3 rounded border border-amber-600 p-4"><legend className="font-semibold">Resolver coincidencias</legend>
      <p>No se fusionan perfiles. Corregir y crear exige que el DNI y correo dejen de coincidir; usar el existente solo modifica los campos que marques.</p>
      <label>Perfil coincidente<select className={field} value={reviewId} onChange={(e) => setReviewId(e.target.value)} required><option value="">Seleccionar</option>
        {matches.map((m) => <option key={m.reviewId} value={m.reviewId}>{m.name} · {m.basis === "dni" ? "DNI" : m.basis === "email" ? "correo" : "DNI y correo"}</option>)}</select></label>
      <label>Decisión<select className={field} value={decision} onChange={(e) => setDecision(e.target.value)} required><option value="">Seleccionar</option>
        <option value={DUPLICATE_DECISIONS[0]}>Usar o actualizar el perfil existente</option>
        {!candidateId && <option value={DUPLICATE_DECISIONS[1]}>Corregir falso positivo y crear por separado</option>}
        <option value={DUPLICATE_DECISIONS[2]}>Rechazar el alta</option></select></label>
      <label>Motivo de la decisión<textarea className={field} name="reason" required maxLength={1000} /></label>
      {decision === "use_or_update_existing" && <fieldset><legend>Campos que autorizo actualizar</legend><p>Sin marcar campos, solo se utiliza el perfil existente.</p>
        {assistedFields.map((key) => <label key={key} className="flex gap-2"><input type="checkbox" name="confirmedFields" value={key} />{labels[key]}</label>)}</fieldset>}
    </fieldset>}
    <Message text={message} /><button className={button} disabled={pending}>{matches.length ? "Confirmar decisión" : candidateId ? "Guardar perfil asistido" : "Comprobar duplicados y guardar"}</button>
  </form>;
}

export function AssistedCommands({ candidateId, version, status, consent, policy }: {
  candidateId: string; version: number; status: string; consent?: string;
  policy: { version: string; policy_text: string; policy_hash: string };
}) {
  const router = useRouter(); const [pending, start] = useTransition(); const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    start(async () => { const result = await assistedCommandAction({ candidateId, version, command: form.get("command"),
      confirmed: form.get("confirmed") === "on", policyVersion: policy.version, policyHash: policy.policy_hash });
      setMessage(result.message); if (result.success) router.refresh(); });
  }
  return <section className="space-y-4 rounded border bg-white p-5"><h2 className="text-xl font-semibold">Consentimiento y activación</h2>
    <p>{policy.policy_text} Versión {policy.version}; no es texto municipal aprobado.</p>
    <p>Consentimiento: {consent === "accepted" ? "aceptado" : consent === "withdrawn" ? "retirado" : "pendiente"}.</p>
    <form onSubmit={submit} className="grid gap-3" aria-busy={pending}>
      <label>Acción asistida<select className={field} name="command" defaultValue={consent === "accepted" ? "withdraw_consent" : "accept_consent"}>
        <option value="accept_consent">Registrar aceptación presencial</option><option value="withdraw_consent">Registrar retiro del consentimiento</option></select></label>
      <p>El retiro cierra las participaciones abiertas y revoca accesos empresariales. Una nueva aceptación no los restablece.</p>
      <label className="flex gap-2"><input name="confirmed" type="checkbox" required />Confirmo la decisión de la persona atendida.</label>
      <button className={button} disabled={pending}>Guardar consentimiento asistido</button>
    </form>
    {status !== "active" && <form onSubmit={submit} className="grid gap-3" aria-busy={pending}>
      <p>Para activar: localidad, experiencia, categorías, disponibilidad, contacto y consentimiento. El perfil asistido puede evaluarse sin PDF; derivarlo requiere un CV válido.</p>
      <input type="hidden" name="command" value="activate" /><input type="hidden" name="confirmed" value="on" />
      <button className={button} disabled={pending}>Activar para evaluación interna</button></form>}
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
  return <form onSubmit={submit} className="grid gap-3 rounded border bg-white p-5" aria-busy={pending}>
    <h2 className="text-xl font-semibold">Vincular cuenta presencialmente</h2>
    <p>Se exige correo verificado y una cuenta candidata sin otro perfil. La persona debe registrarse y abrir Mi perfil para dejar su solicitud pendiente.</p>
    {requests.length === 0 && <p>No hay solicitudes pendientes para este perfil.</p>}
    <label>Cuenta solicitante<select className={field} name="accountId" required defaultValue=""><option value="">Seleccionar</option>
      {requests.map((r) => <option key={r.accountId} value={r.accountId} disabled={!r.verified}>{r.email} · {r.verified ? "verificado" : "sin verificar"}</option>)}</select></label>
    <label>DNI exhibido<input className={field} name="dni" type="password" autoComplete="off" inputMode="numeric" required /></label>
    <label>Motivo de vinculación (obligatorio si resuelve un conflicto)<textarea className={field} name="reason" maxLength={1000} /></label>
    <label className="flex gap-2"><input name="verifiedInPerson" type="checkbox" required />Comprobé presencialmente el DNI exhibido, sin guardar una copia.</label>
    <Message text={message} /><button className={button} disabled={pending || requests.length === 0}>Vincular conservando historial</button>
  </form>;
}
