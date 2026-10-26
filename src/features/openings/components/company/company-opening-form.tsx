"use client";
import { openingStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCompanyOpeningAction, submitCompanyOpeningAction } from "../../company-actions";
import type { CompanyOffer } from "../../company-service";
import { Button, Combobox, ComboboxContent, ComboboxItem, ComboboxList, ComboboxTrigger } from "@/components/ui";
import { FieldHelp } from "@/components/forms/field-help";
import { OPENING_MODALITY_OPTIONS, OPENING_CONTRACT_OPTIONS, type OpeningOption } from "@/domain/catalogs/opening-options";
import { canEditCompanyOpening, canCancelCompanyOpening } from "../../company-opening-policy";
import { CompanyOpeningCancel } from "./company-opening-cancel";
import { ModerationHistory } from "../moderation-history";
import { CompanyOpeningDetails } from "./company-opening-details";

function OpeningComboboxField({ name, label, initial, options, required = false }: {
  name: string; label: string; initial: string; options: readonly OpeningOption[]; required?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const selected = options.find(option => option.value === value);
  return <>
    <input type="hidden" name={name} value={value} required={required} />
    <div className="grid gap-1">
      <span className="municipal-label text-sm font-semibold">{label}<FieldHelp label={label} description={options.map(option => `${option.label}: ${option.description}`).join(" ")} /></span>
      <Combobox value={value} onValueChange={(next) => setValue(next ?? "")}>
        <ComboboxTrigger aria-label={label}>
          <span className={value ? "" : "text-muted-foreground"}>{selected?.label ?? "Seleccionar…"}</span>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxList>
            {options.map(option => <ComboboxItem key={option.value} value={option.value}>{option.label}</ComboboxItem>)}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  </>;
}

export function CompanyOpeningForm({ opening, categories }: { opening: CompanyOffer | null; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const openingId = opening?.id;
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const openingTarget = opening ? `${opening.id}:${opening.version}` : null;
  const editButton = useRef<HTMLButtonElement>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const wasEditing = useRef(false);
  const [saved, saveAction, saving] = useActionState(saveCompanyOpeningAction, { message: "", success: false });
  const [submitted, submitAction, submitting] = useActionState(submitCompanyOpeningAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (saved.message) feedback.current?.focus();
    if (saved.success && saved.id) {
      if (!openingId && saved.reference) router.push(`/empresa/ofertas/${saved.reference}`);
      else router.refresh();
    }
  }, [saved, openingId, router]);
  useEffect(() => { if (submitted.success) router.refresh(); }, [submitted, router]);
  const publishedEditing = opening?.status === "published";
  const editable = !opening || canEditCompanyOpening(opening.status);
  const editing = !opening || (editable && editingTarget === openingTarget);
  useEffect(() => {
    if (openingId && editing) editorHeading.current?.focus();
    else if (wasEditing.current) editButton.current?.focus();
    wasEditing.current = editing;
  }, [editing, openingId]);
  const field = "w-full rounded border border-slate-500 p-2";
  return <div className="space-y-6">
    {opening && <p role="status" className="rounded bg-blue-50 p-3">Estado: <strong>{displayLabel(openingStatusLabels, opening.status)}</strong>. {opening.status === "closed" ? "La fecha de cierre terminó. La oferta ya no recibe postulaciones." : "Solo la Oficina puede publicar o confirmar resultados."}</p>}
    {opening && editable && <Button ref={editButton} variant="secondary" className="justify-self-start" aria-expanded={editing} disabled={saving || submitting}
      onClick={() => setEditingTarget(editing ? null : openingTarget)}>{editing ? "Cancelar edición" : "Editar oferta"}</Button>}
    {opening && !editing && <CompanyOpeningDetails opening={opening} />}
    {publishedEditing && editing && <p>Al guardar los cambios, la oferta volverá a revisión municipal y dejará de estar publicada hasta su aprobación. Las participaciones y sus resultados se conservan.</p>}
    <p ref={feedback} tabIndex={-1} role={saved.success ? "status" : "alert"} aria-live="polite">{saved.message}</p>
    {editing && <Form action={saveAction} result={saved} requirements={publishedEditing ? [{ names: ["categories"], message: "Seleccioná al menos una categoría laboral." }] : []} className="grid gap-4 rounded border bg-white p-5" aria-busy={saving}>
      {opening && <h2 ref={editorHeading} tabIndex={-1} className="text-xl font-semibold md:col-span-2">Editar oferta</h2>}
      {opening && <><input type="hidden" name="id" value={opening.id} /><input type="hidden" name="version" value={opening.version} /></>}
      <Field className="grid gap-1">Título<input className={field} name="title" required={publishedEditing} defaultValue={opening?.title ?? ""} maxLength={200} /></Field>
      <Field className="grid gap-1">Tareas<textarea className={field} name="tasks" required={publishedEditing} defaultValue={opening?.tasks ?? ""} maxLength={5000} rows={4} /></Field>
      <Field className="grid gap-1">Requisitos<textarea className={field} name="requirements" required={publishedEditing} defaultValue={opening?.requirements ?? ""} maxLength={5000} rows={4} /></Field>
      <Field className="grid gap-1">Vacantes<input className={field} name="vacancies" required={publishedEditing} type="number" min={1} defaultValue={opening?.vacancies ?? ""} /></Field>
      <Field className="grid gap-1">Ubicación<input className={field} name="location" required={publishedEditing} defaultValue={opening?.location ?? ""} maxLength={200} /></Field>
      <OpeningComboboxField name="modality" required={publishedEditing} label="Modalidad" initial={opening?.modality ?? ""} options={OPENING_MODALITY_OPTIONS} />
      <Field className="grid gap-1">Horario<input className={field} name="schedule" required={publishedEditing} defaultValue={opening?.schedule ?? ""} maxLength={500} /></Field>
      <OpeningComboboxField name="contractType" required={publishedEditing} label="Tipo de contratación" initial={opening?.contract_type ?? ""} options={OPENING_CONTRACT_OPTIONS} />
      <Field className="grid gap-1">Fecha de cierre<input className={field} name="closingDate" required={publishedEditing} type="date" defaultValue={opening?.closingDate ?? ""} /></Field>
      <Field className="grid gap-1">Salario (opcional)<input className={field} name="salary" defaultValue={opening?.salary ?? ""} maxLength={500} /></Field>
      <Field className="grid gap-1">Beneficios (opcional)<textarea className={field} name="benefits" defaultValue={opening?.benefits ?? ""} maxLength={2000} /></Field>
      <fieldset className="rounded border p-3"><legend className="font-semibold">Categorías</legend><div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <Field key={category.id} className="flex gap-2"><input type="checkbox" name="categories" value={category.id} defaultChecked={opening?.categories.some((selected) => selected.id === category.id)} />{category.name}</Field>)}</div></fieldset>
      <Button type="submit" busy={saving}>{publishedEditing ? "Guardar cambios y enviar a revisión" : "Guardar borrador"}</Button>
    </Form>}
    {opening && editable && !editing && !publishedEditing && <Form action={submitAction} result={submitted} className="grid gap-3 rounded border bg-white p-5" aria-busy={submitting}>
      <input type="hidden" name="id" value={opening.id} /><input type="hidden" name="version" value={opening.version} />
      <p>Completá todos los datos laborales y guardá los cambios antes de enviar. El envío no publica la oferta.</p>
      <p role={submitted.success ? "status" : "alert"} aria-live="polite">{submitted.message}</p>
      <Button type="submit" busy={submitting}>Enviar a revisión municipal</Button>
    </Form>}
    {opening && canCancelCompanyOpening(opening.status) && <CompanyOpeningCancel openingId={opening.id} version={opening.version} />}
    {opening && <ModerationHistory key={`${opening.id}:${opening.version}`} events={opening.history.map((event, index) => ({ id: `${event.at}:${index}`, ...event })).reverse()} />}
  </div>;
}
