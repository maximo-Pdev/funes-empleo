"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";

const messages = {
  invalid: "El PDF fue rechazado. Revisá formato, estructura y tamaño (máximo 5 MiB). El CV anterior sigue vigente.",
  conflict: "El perfil cambió. Abrí el perfil en otra pestaña para revisar los cambios antes de reintentar.",
  denied: "No tenés permiso o la sesión venció. Iniciá sesión nuevamente antes de reintentar.",
};

export function CvUploadForm({ candidateId, version, label = "Elegir PDF", buttonLabel = "Cargar o reemplazar CV" }: {
  candidateId: string; version: number; label?: string; buttonLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const refreshing = savedVersion === version;
  const saved = savedVersion !== null && !refreshing;
  return <Form className="grid gap-3" aria-busy={busy || refreshing} onChange={() => { setError(""); setSavedVersion(null); }}
    onSubmit={async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      setBusy(true); setError(""); setSavedVersion(null);
      try {
        const response = await fetch("/api/candidate/cv", { method: "POST", headers: { Accept: "application/json" }, body: data });
        const result: { status?: string } = await response.json();
        if (response.ok && result.status === "ok") {
          form.reset(); setSavedVersion(version); router.refresh();
        } else {
          setError(Object.hasOwn(messages, result.status ?? "") ? messages[result.status as keyof typeof messages]
            : "No se pudo guardar el CV. El archivo seleccionado se conserva; podés reintentar.");
        }
      } catch {
        setError("No se pudo confirmar la carga. El archivo se conserva. Revisá el CV vigente antes de reintentar.");
      } finally { setBusy(false); }
    }}>
    <input type="hidden" name="candidateId" value={candidateId} /><input type="hidden" name="version" value={version} />
    <Field className="grid gap-1" label={label} hint="PDF válido de hasta 5 MiB." error={error}>
      <input className="w-full rounded border border-slate-500 bg-white p-2" type="file" name="cv" accept=".pdf,application/pdf" required
        data-max-bytes={5 * 1024 * 1024} data-file-error="Elegí un PDF no vacío de hasta 5 MiB." />
    </Field>
    {saved && <p role="status">CV guardado.</p>}
    {refreshing && <p role="status">CV guardado; actualizando el perfil…</p>}
    <button disabled={busy || refreshing} className="rounded bg-blue-800 p-3 text-white disabled:opacity-60">{busy || refreshing ? "Cargando CV…" : buttonLabel}</button>
  </Form>;
}
