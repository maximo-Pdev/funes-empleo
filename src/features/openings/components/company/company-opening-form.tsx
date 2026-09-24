"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveCompanyOpeningAction, submitCompanyOpeningAction } from "../../company-actions";
import type { CompanyOffer } from "../../company-service";

export function CompanyOpeningForm({ opening, categories }: { opening: CompanyOffer | null; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [saved, saveAction, saving] = useActionState(saveCompanyOpeningAction, { message: "", success: false });
  const [submitted, submitAction, submitting] = useActionState(submitCompanyOpeningAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (saved.message) feedback.current?.focus();
    if (saved.success && saved.id) {
      if (!opening) router.push(`/empresa/ofertas/${saved.id}`);
      else router.refresh();
    }
  }, [saved, opening, router]);
  useEffect(() => { if (submitted.success) router.refresh(); }, [submitted, router]);
  const editable = !opening || opening.status === "draft" || opening.status === "changes_requested";
  const field = "w-full rounded border border-slate-500 p-2";
  return <div className="space-y-6">
    {opening && <p role="status" className="rounded bg-blue-50 p-3">Estado: <strong>{opening.status}</strong>. {opening.status === "closed" ? "La fecha de cierre terminó. La oferta ya no recibe postulaciones." : "Solo la Oficina puede publicar o confirmar resultados."}</p>}
    {editable && <form action={saveAction} className="grid gap-4 rounded border bg-white p-5" aria-busy={saving}>
      {opening && <><input type="hidden" name="id" value={opening.id} /><input type="hidden" name="version" value={opening.version} /></>}
      <label className="grid gap-1">Título<input className={field} name="title" defaultValue={opening?.title ?? ""} maxLength={200} /></label>
      <label className="grid gap-1">Tareas<textarea className={field} name="tasks" defaultValue={opening?.tasks ?? ""} maxLength={5000} rows={4} /></label>
      <label className="grid gap-1">Requisitos<textarea className={field} name="requirements" defaultValue={opening?.requirements ?? ""} maxLength={5000} rows={4} /></label>
      <label className="grid gap-1">Vacantes<input className={field} name="vacancies" type="number" min={1} defaultValue={opening?.vacancies ?? ""} /></label>
      <label className="grid gap-1">Ubicación<input className={field} name="location" defaultValue={opening?.location ?? ""} maxLength={200} /></label>
      <label className="grid gap-1">Modalidad<input className={field} name="modality" defaultValue={opening?.modality ?? ""} maxLength={100} /></label>
      <label className="grid gap-1">Horario<input className={field} name="schedule" defaultValue={opening?.schedule ?? ""} maxLength={500} /></label>
      <label className="grid gap-1">Tipo de contratación<input className={field} name="contractType" defaultValue={opening?.contract_type ?? ""} maxLength={100} /></label>
      <label className="grid gap-1">Fecha de cierre<input className={field} name="closingDate" type="date" defaultValue={opening?.closingDate ?? ""} /></label>
      <label className="grid gap-1">Salario (opcional)<input className={field} name="salary" defaultValue={opening?.salary ?? ""} maxLength={500} /></label>
      <label className="grid gap-1">Beneficios (opcional)<textarea className={field} name="benefits" defaultValue={opening?.benefits ?? ""} maxLength={2000} /></label>
      <fieldset className="rounded border p-3"><legend className="font-semibold">Categorías</legend><div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.id} className="flex gap-2"><input type="checkbox" name="categories" value={category.id} defaultChecked={opening?.categories.some((selected) => selected.id === category.id)} />{category.name}</label>)}</div></fieldset>
      <p ref={feedback} tabIndex={-1} role={saved.success ? "status" : "alert"} aria-live="polite">{saved.message}</p>
      <button disabled={saving} className="rounded bg-blue-800 p-3 text-white">Guardar borrador</button>
    </form>}
    {opening && editable && <form action={submitAction} className="grid gap-3 rounded border bg-white p-5" aria-busy={submitting}>
      <input type="hidden" name="id" value={opening.id} /><input type="hidden" name="version" value={opening.version} />
      <p>Completá todos los datos laborales y guardá los cambios antes de enviar. El envío no publica la oferta.</p>
      <p role={submitted.success ? "status" : "alert"} aria-live="polite">{submitted.message}</p>
      <button disabled={submitting} className="rounded bg-green-800 p-3 text-white">Enviar a revisión municipal</button>
    </form>}
    {opening && <section className="rounded border bg-white p-5"><h2 className="text-xl font-semibold">Historial de moderación</h2>
      {opening.history.length === 0 ? <p className="mt-2">Todavía no hay decisiones.</p> : <ol className="mt-3 grid gap-3">{opening.history.map((event, index) => <li key={`${event.at}-${index}`} className="rounded border p-3">
        <p>{new Date(event.at).toLocaleString("es-AR")}: <strong>{event.newStatus}</strong></p>
        {event.message && <p>Mensaje de la Oficina: {event.message}</p>}
      </li>)}</ol>}
    </section>}
  </div>;
}
