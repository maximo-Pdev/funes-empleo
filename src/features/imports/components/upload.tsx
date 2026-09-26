"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMPORT_HEADERS, IMPORT_LIMITS } from "../mapping";
import { Button } from "@/components/ui/button";
export function ImportUpload({ retry }: { retry?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <form className="grid gap-4 [&_input]:rounded [&_input]:border [&_input]:border-slate-500 [&_input]:p-2" onSubmit={async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    try {
      if (!(file instanceof File) || file.size > IMPORT_LIMITS.bytes || !file.size || !data.has("fictional")) throw new Error("Revisá el CSV y confirmá que los datos son ficticios.");
      const response = await fetch(`/api/admin/imports/preview${retry ? `?retry=${encodeURIComponent(retry)}` : ""}`, {
        method: "POST", headers: { "Content-Type": "text/csv", "X-Fictional-Data": "true" }, body: file });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(`/admin/imports/${result.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo previsualizar."); }
    finally { setBusy(false); }
  }}>
    <p>Solo demostración: no cargar el padrón real. Máximo 5 MiB, 10.000 filas; UTF-8 y separador coma.</p>
    <p className="break-all">Encabezados exactos: {IMPORT_HEADERS.join(",")}</p>
    <label>CSV ficticio <input name="file" type="file" accept=".csv,text/csv" required /></label>
    <label><input name="fictional" type="checkbox" required /> Confirmo que contiene solo datos ficticios</label>
    <Button disabled={busy} type="submit">{busy ? "Validando CSV…" : "Previsualizar"}</Button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
