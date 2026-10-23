"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, FeedbackMessage } from "@/components/ui";
import { openingCandidatePreviewAction } from "@/features/candidates/matching-actions";
import { createAdminNominationAction } from "@/features/participations/nomination-actions";
import { adminMutationError } from "@/lib/errors/admin-mutation-result";
import type { OpeningCandidatePreview, OpeningMatches } from "@/validation/opening-matching";

type Selection = { id: string; name: string };

export function OpeningCandidateMatchesList({ openingId, openingReference, matches }: { openingId: string; openingReference: string; matches: OpeningMatches }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const request = useRef(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [profile, setProfile] = useState<(OpeningCandidatePreview & { cvReference: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const visible = matches.items.filter(candidate => !removed.has(candidate.id) && !candidate.participationId);
  const total = matches.total - matches.items.filter(candidate => removed.has(candidate.id)).length;
  const pageCount = Math.ceil(total / matches.pageSize);

  async function loadProfile(candidate: Selection) {
    const currentRequest = ++request.current;
    setSelection(candidate);
    setProfile(null);
    setError("");
    setLoading(true);
    try {
      const result = await openingCandidatePreviewAction({ openingId, candidateId: candidate.id });
      if (request.current !== currentRequest) return;
      setProfile(result.profile);
      setError(adminMutationError(result) ?? (result.profile ? "" : "No pudimos cargar el perfil."));
    } catch {
      if (request.current === currentRequest) setError("No pudimos cargar el perfil. Volvé a intentarlo.");
    } finally {
      if (request.current === currentRequest) setLoading(false);
    }
  }

  function closeDialog() {
    request.current++;
    dialog.current?.close();
    setSelection(null);
    setProfile(null);
    setLoading(false);
    setError("");
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else heading.current?.focus();
    });
  }

  function openProfile(candidate: Selection, button: HTMLElement) {
    opener.current = button;
    void loadProfile(candidate);
    dialog.current?.showModal();
  }

  function nominate() {
    if (!profile || pending) return;
    const selected = profile;
    setError("");
    startTransition(async () => {
      try {
        const result = await createAdminNominationAction({ openingId, openingVersion: selected.openingVersion,
          candidateId: selected.id, candidateVersion: selected.candidateVersion });
        const message = adminMutationError(result);
        if (message || !result.participationId) {
          setError(message ?? "No pudimos confirmar la nominación. Actualizá el perfil antes de reintentar.");
          router.refresh();
          return;
        }
        setRemoved(previous => new Set(previous).add(selected.id));
        setNotice("Candidato nominado a esta oferta. La empresa todavía no recibe su perfil.");
        closeDialog();
        router.refresh();
      } catch { setError("No pudimos confirmar la nominación. Volvé a cargar el perfil antes de reintentar."); }
    });
  }

  return <section aria-labelledby="opening-matches" className="my-6 space-y-3 rounded-lg border border-slate-300 bg-white p-4">
    <h2 ref={heading} tabIndex={-1} id="opening-matches" className="text-xl font-semibold">Candidatos con rubros coincidentes</h2>
    <p className="text-sm">Perfiles aptos que comparten al menos un rubro y aún no participan de esta oferta. La nominación inicia la evaluación municipal, no una derivación.</p>
    {notice && <p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-green-950">{notice}</p>}
    {!matches.available ? <EmptyState title="Coincidencias no disponibles" description="La oferta debe estar publicada o pausada, vigente y pertenecer a una empresa activa." /> : <>
      <p aria-live="polite">Coincidencias: {total}</p>
      {!visible.length ? <EmptyState title="Sin candidatos en esta página" description="No hay perfiles aptos sin participación previa. Revisá los rubros o volvé a la primera página." /> :
        <ul className="grid gap-3 md:grid-cols-2">{visible.map(candidate => <li key={candidate.id} className="min-w-0 rounded-lg border border-slate-200 p-3">
          <h3 className="truncate font-semibold" title={candidate.displayName}>{candidate.displayName}</h3>
          <p className="truncate text-sm">{candidate.locality ?? "Localidad no informada"}</p>
          <p className="line-clamp-2 text-sm text-slate-700">Rubros coincidentes: {candidate.matchedCategories.map(category => category.name).join(", ")}</p>
          <button type="button" className="mt-2 rounded border border-blue-800 px-3 py-1.5 text-sm font-medium text-blue-800"
            aria-label={`Ver perfil de ${candidate.displayName}`} onClick={event => openProfile({ id: candidate.id, name: candidate.displayName }, event.currentTarget)}>Ver perfil y nominar</button>
        </li>)}</ul>}
      {matches.page > 1 && !visible.length && <Link className="text-blue-800 underline" href={`/admin/openings/${openingReference}#opening-matches`}>Volver a la primera página</Link>}
      {pageCount > 1 && <nav aria-label="Páginas de coincidencias" className="flex flex-wrap gap-4">
        {matches.page > 1 && <Link className="text-blue-800 underline" href={`/admin/openings/${openingReference}?matchPage=${matches.page - 1}#opening-matches`}>Anterior</Link>}
        <span>Página {matches.page} de {pageCount}</span>
        {matches.page < pageCount && <Link className="text-blue-800 underline" href={`/admin/openings/${openingReference}?matchPage=${matches.page + 1}#opening-matches`}>Siguiente</Link>}
      </nav>}
    </>}
    <dialog ref={dialog} aria-labelledby="candidate-preview-title" className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-xl border border-slate-300 bg-white p-5 text-slate-950 shadow-xl backdrop:bg-slate-950/50"
      onCancel={event => { event.preventDefault(); if (!pending) closeDialog(); }}>
      <div className="flex items-start justify-between gap-3">
        <h2 id="candidate-preview-title" className="text-xl font-semibold">Perfil de {selection?.name ?? "candidato"}</h2>
        <button type="button" disabled={pending} className="shrink-0 rounded border px-3 py-1.5 disabled:opacity-50" onClick={closeDialog}>Cerrar</button>
      </div>
      {loading && <p role="status" className="mt-4">Cargando perfil…</p>}
      {error && <div className="mt-4"><FeedbackMessage tone="error">{error}</FeedbackMessage></div>}
      {profile && <div className="mt-4 space-y-4">
        <p><strong>Oferta destino:</strong> {profile.openingTitle}</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="font-semibold">Localidad</dt><dd>{profile.locality ?? "Sin informar"}</dd></div>
          <div><dt className="font-semibold">Disponibilidad</dt><dd>Disponible</dd></div>
          <div><dt className="font-semibold">Vigencia del perfil</dt><dd>{new Date(profile.refreshDueAt).toLocaleDateString("es-AR", { timeZone: "America/Buenos_Aires" })}</dd></div>
          <div><dt className="font-semibold">Rubros coincidentes</dt><dd>{profile.matchedCategories.map(category => category.name).join(", ")}</dd></div>
        </dl>
        <div><h3 className="font-semibold">Rubros del perfil</h3><p>{profile.categories.map(category => `${category.name} (${category.kind === "interest" ? "interés" : "ocupación"})`).join(", ")}</p></div>
        <div><h3 className="font-semibold">Habilidades y experiencia</h3><p className="whitespace-pre-wrap break-words">{profile.skills ?? "Sin información adicional"}</p></div>
        <a className="inline-block text-blue-800 underline" href={`/api/cv/${profile.cvReference}`} target="_blank" rel="noopener noreferrer">Abrir CV PDF en otra pestaña</a>
        <p className="text-sm">Nominar no comparte el perfil con la empresa. La derivación requiere otra decisión municipal.</p>
        <Button type="button" busy={pending} onClick={nominate}>Nominar a esta oferta</Button>
      </div>}
      {!loading && selection && !pending && <button type="button" className="mt-4 block text-blue-800 underline" onClick={() => void loadProfile(selection)}>Volver a cargar perfil</button>}
    </dialog>
  </section>;
}
