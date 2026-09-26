"use client";
import { useState } from "react";
import Link from "next/link";
import type { ImportPreview } from "../preview-service";
import { IMPORT_FIELDS, IMPORT_MESSAGES } from "../mapping";
import { resolveImportAction } from "../actions";
import { Button } from "@/components/ui/button";
const labels = { name: "Nombre", dni: "DNI", email: "Correo", phone: "Teléfono", locality: "Localidad",
  categories: "Categorías (DEMO-A|DEMO-B)", summary: "Experiencia", availability: "Disponibilidad (available/unavailable)", reference: "Referencia ficticia" };
export function ImportBatch({ initial }: { initial: ImportPreview }) {
  const [preview, setPreview] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const editable = ["blocked", "preview_ready"].includes(preview.status);
  return <div className="grid gap-6 [&_input:not([type=checkbox])]:block [&_input:not([type=checkbox])]:w-full [&_input]:rounded [&_input]:border [&_input]:border-slate-500 [&_input]:p-2 [&_select]:block [&_select]:max-w-full [&_select]:rounded [&_select]:border [&_select]:p-2 [&_textarea]:block [&_textarea]:w-full [&_textarea]:rounded [&_textarea]:border [&_textarea]:p-2">
    <p role="status">{preview.status === "completed" ? "Importación completada" : preview.status === "preview_ready" ? "Listo para confirmar" : preview.status === "failed" ? "Importación fallida: no se incorporaron cambios" : "Importación bloqueada"}</p>
    <p>Total: {preview.total}. Aceptables: {preview.valid}. Inválidas o categorías sin mapear: {preview.invalid}. Duplicadas: {preview.duplicates}.</p>
    <p>Los perfiles nuevos serán borradores sin consentimiento ni CV. Las filas rechazadas no se incorporan.</p>
    <p>Impacto previsto: {preview.rows.filter(r => !r.errors.length && r.decision !== "reject" && r.decision !== "use_or_update_existing").length} altas,
      {" "}{preview.rows.filter(r => r.decision === "use_or_update_existing").length} usos o actualizaciones expresas,
      {" "}{preview.rows.filter(r => r.decision === "reject").length} rechazos.</p>
    {error && <p role="alert">{error} Recargá la página antes de reintentar.</p>}
    {preview.status === "failed" && <><p>Código seguro: {preview.failure}</p><Link href={`/admin/imports/new?retry=${preview.id}`}>Cargar archivo corregido como nuevo intento</Link></>}
    {preview.retryOf && <Link href={`/admin/imports/${preview.retryOf}`}>Ver intento anterior</Link>}
    <nav aria-label="Páginas de filas"><Button variant="secondary" disabled={!page || busy} onClick={() => setPage(page - 1)}>Anterior</Button>{" "}
      <span>Página {page + 1} de {Math.max(1, Math.ceil(preview.rows.length / 50))}</span>{" "}
      <Button variant="secondary" disabled={(page + 1) * 50 >= preview.rows.length || busy} onClick={() => setPage(page + 1)}>Siguiente</Button></nav>
    {preview.rows.slice(page * 50, (page + 1) * 50).map(row => <section className="rounded border p-4" key={row.id} aria-label={`Fila ${row.number}`}>
      <h2>Fila {row.number}: {row.name}</h2><p>DNI {row.dni}; correo {row.email || "no informado"}; teléfono {row.phone || "no informado"}.</p>
      <p>Localidad: {row.locality || "pendiente"}. Categorías: {row.categories.join(", ") || "pendientes"}. Disponibilidad: {row.availability === "available" ? "disponible" : row.availability === "unavailable" ? "no disponible" : "inválida"}.</p>
      <p className="whitespace-pre-wrap break-words">Experiencia: {row.summary || "pendiente"}</p>
      {row.decision && <p>Decisión registrada: {row.decision === "reject" ? "rechazar" : row.decision === "correct_and_create" ? "corregir y crear" : "usar existente"}.
        {row.decision === "use_or_update_existing" && ` Campos a actualizar: ${row.fields.map(f => labels[f as keyof typeof labels]).join(", ") || "ninguno"}.`}</p>}
      {row.errors.map(code => <p key={code}>{IMPORT_MESSAGES[code] ?? "Revisá los datos de la fila."}</p>)}
      {editable && <details><summary>Corregir o resolver fila {row.number}</summary>
        <form className="grid gap-3" onSubmit={async event => {
          event.preventDefault(); setBusy(true); setError("");
          const form = new FormData(event.currentTarget);
          const decision = String(form.get("decision"));
          const candidate = row.matches.find(m => m.id === form.get("candidate"));
          const data = Object.fromEntries(Object.keys(labels).map(key => [key, key === "categories"
            ? String(form.get(key) || "").split("|").map(s => s.trim()).filter(Boolean) : String(form.get(key) || "").trim()]));
          try {
            const result = await resolveImportAction({ batchId: preview.id, version: preview.version, rowId: row.id,
              decision, reason: form.get("reason"), data: decision === "correct_and_create" ? data : null,
              candidateId: candidate?.id ?? null, candidateVersion: candidate?.version ?? null, fields: form.getAll("fields") });
            if (!result.ok) setError(result.error); else setPreview(result.preview);
          } catch { setError("No se pudo guardar la decisión."); } finally { setBusy(false); }
        }}>
          <label>Decisión<select name="decision" defaultValue="correct_and_create"><option value="correct_and_create">Corregir y crear separado</option><option value="use_or_update_existing">Usar o actualizar existente</option><option value="reject">Rechazar fila</option></select></label>
          <label>Motivo interno<textarea name="reason" required maxLength={1000} /></label>
          <label>Perfil coincidente<select name="candidate"><option value="">Seleccioná si usás existente</option>{row.matches.map(m => <option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select></label>
          <fieldset><legend>Actualizar existente: marcar solo los campos autorizados del CSV</legend>{IMPORT_FIELDS.map(field => <label className="block" key={field}><input type="checkbox" name="fields" value={field} /> {labels[field]}</label>)}</fieldset>
          <fieldset><legend>Corregir y crear: volver a ingresar la fila completa con datos ficticios</legend>{Object.entries(labels).map(([key, label]) => <label className="block" key={key}>{label}<input name={key} defaultValue={key === "availability" ? "available" : ""} /></label>)}</fieldset>
          <Button type="submit" disabled={busy}>Guardar decisión y revalidar</Button>
        </form>
      </details>}
    </section>)}
    {editable && <Button disabled={busy || preview.status !== "preview_ready" || !preview.valid} onClick={async () => {
      setBusy(true); setError("");
      try {
        const response = await fetch(`/api/admin/imports/${preview.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: preview.version, hash: preview.hash, mapping: preview.mapping }) });
        const result = await response.json();
        if (!response.ok) setError(result.error); else setPreview(result.preview);
      } catch { setError("No se pudo confirmar. Consultá el historial antes de volver a intentarlo."); } finally { setBusy(false); }
    }}>{busy ? "Procesando…" : "Confirmar importación"}</Button>}
    <Link href="/admin/imports">Historial de importaciones</Link>
  </div>;
}
