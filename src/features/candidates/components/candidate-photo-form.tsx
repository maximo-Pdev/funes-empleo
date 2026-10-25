"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";

export function CandidatePhotoForm({ candidateId, version, photo, name, cleanupPending: pendingCleanup = false, unavailable = false }: {
  candidateId: string; version: number; photo?: { id: string } | null; name: string; cleanupPending?: boolean; unavailable?: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [committedVersion, setCommittedVersion] = useState<number | null>(null);
  const [localCleanupPending, setCleanupPending] = useState<boolean | null>(null);
  const cleanupPending = localCleanupPending ?? pendingCleanup;
  const refreshing = committedVersion === version && !cleanupPending;
  async function mutate(command: "upload" | "remove" | "cleanup", file?: File) {
    if (unavailable || inFlight.current || refreshing) return;
    const data = new FormData();
    data.set("candidateId", candidateId);
    data.set("version", String(version));
    data.set("command", command);
    if (file) data.set("photo", file);
    inFlight.current = true; setBusy(true); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/candidate/photo", { method: "POST", headers: { Accept: "application/json" }, body: data });
      const result: { status?: string; message?: string } = await response.json();
      if ((response.ok && result.status === "ok") || result.status === "cleanup_pending") {
        const pending = result.status === "cleanup_pending";
        setCleanupPending(pending);
        setSuccess(true); setMessage(result.message || (pending ? "Cambio guardado. El borrado del archivo anterior está pendiente; podés reintentar la eliminación." : command === "remove" ? "Foto eliminada." : "Foto guardada."));
        // Retrying an already-detached file may not increment the profile version.
        setCommittedVersion(command === "cleanup" || (command === "remove" && !photo) ? null : version); router.refresh();
      } else setMessage(result.message || "No se pudo guardar la foto. Revisá el perfil antes de reintentar.");
    } catch { setMessage("No se pudo confirmar el cambio. Revisá la foto vigente antes de reintentar."); }
    finally { inFlight.current = false; setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <section aria-label="Foto de perfil" className="flex flex-wrap items-center gap-4">
    <Avatar className="!size-20">
      {photo && <AvatarImage src={`/api/candidate/photo/${photo.id}`} alt={`Foto de ${name}`} />}
      <AvatarFallback aria-label={photo ? `Foto no disponible de ${name}` : `Sin foto de ${name}`}>{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("") || "?"}</AvatarFallback>
    </Avatar>
    <Form className="grid min-w-0 flex-1 basis-60 gap-3" aria-label="Gestionar foto" aria-busy={busy || refreshing} onSubmit={event => event.preventDefault()}>
      <div hidden><Field label="Elegir foto de perfil">
        <input ref={input} hidden type="file" name="photo" accept="image/jpeg,image/png,.jpg,.jpeg,.png" tabIndex={-1}
          disabled={unavailable || busy || refreshing} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void mutate("upload", file); }} />
      </Field></div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={unavailable || busy || refreshing} onClick={() => input.current?.click()}>{photo ? "Cambiar foto" : "Subir foto"}</Button>
        <Button variant="secondary" disabled={unavailable || (!photo && !cleanupPending) || busy || refreshing} onClick={() => void mutate(cleanupPending ? "cleanup" : "remove")}>{cleanupPending ? "Reintentar eliminación" : "Eliminar foto"}</Button>
      </div>
      <p className="text-sm text-foreground-secondary">Foto opcional. JPEG o PNG de hasta 5 MiB. No es un requisito para activar el perfil.</p>
      {unavailable && <p role="status">La foto de perfil no está disponible en este momento. Podés completar el resto de tus datos.</p>}
      {!message && cleanupPending && <p role="status">Queda pendiente borrar el archivo anterior. Podés reintentar sin eliminar la foto actual.</p>}
      {message && <p role={success ? "status" : "alert"}>{message}{refreshing && " Actualizando el perfil…"}</p>}
    </Form>
  </section>;
}

