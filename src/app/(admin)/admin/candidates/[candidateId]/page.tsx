import { formatFunesDate, formatFunesDateTime } from "@/lib/time/presentation";
import { CategoryLabels } from "@/components/job-category-label";
import { pageRecordIdentifier } from "@/lib/records/page-references";
import { RecordLink as Link, RecordAnchor } from "@/components/ui/record-link";
import { candidateProfileStatusLabels, accountStatusLabels, displayLabel, availabilityLabel } from "@/domain/presentation/labels";
import { accountStatusTones, availabilityTones, candidateProfileStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { Badge, EmptyState, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import { getAdminCandidate } from "@/features/candidates/search-service";
import { getAssistedWorkspace } from "@/features/candidates/assisted-service";
import { AssistedProfileForm, AssistedCommands, ClaimForm } from "@/features/candidates/components/assisted/assisted-forms";
import { CvUploadForm } from "@/features/candidates/components/cv-upload-form";
import { CandidateHistory } from "@/features/candidates/components/candidate-history";
import { candidateAccountDecisionAction } from "@/features/candidates/admin-actions";
import { participationStatusLabel } from "@/features/participations/components/participation-timeline";
import { SafetyDecisionForm } from "@/features/participations/components/safety-decision-form";
import { InternalNoteForm } from "@/features/participations/components/internal-note-form";
import { recordEvaluationAction } from "@/features/participations/evaluation-actions";
import { requireActiveAccount } from "@/lib/auth/guards";
import { recordReference } from "@/lib/records/references";
import layout from "@/components/ui/detail-layout.module.css";
import { collectionPage } from "@/lib/collections/limits";

export const dynamic = "force-dynamic";

export default async function AdminCandidateDetailPage({ params, searchParams }: {
  params: Promise<{ candidateId: string }>; searchParams: Promise<{ cv?: string; notesPage?: string | string[] }>;
}) {
  const { user } = await requireActiveAccount(["admin"]);
  const { candidateId: reference } = await params;
  const candidateId = await pageRecordIdentifier("candidate", reference, `/admin/candidates/${reference}`, await searchParams);
  const { cv, notesPage: rawNotesPage } = await searchParams;
  const notesPage = collectionPage(rawNotesPage);
  const { candidate, currentCv, referralEligible, participations, notes, notesHasNext, audit, nextAuditCursor } = await getAdminCandidate(candidateId, notesPage);
  const courseReference = await recordReference("candidate", candidate.id);

  const assisted = candidate.origin === "assisted";
  const maintenance = assisted && !candidate.account_id && candidate.status !== "archived" && !candidate.archived_at
    ? await getAssistedWorkspace(candidateId) : null;
  const workspace = maintenance?.workspace;
  const editable = workspace?.profile.origin === "assisted" && !workspace.profile.account_id && workspace.profile.status !== "archived"
    ? workspace : null;

  const profileDetails = <section aria-labelledby="candidate-details" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="candidate-details" className="text-xl font-semibold">Perfil candidato</h2>
        <p className="flex flex-wrap items-center gap-2">Estado <Badge variant="status" tone={statusTone(candidateProfileStatusTones, candidate.status)}>{displayLabel(candidateProfileStatusLabels, candidate.status)}</Badge></p>
        <p className="flex flex-wrap items-center gap-2">Cuenta {candidate.accounts ? <Badge variant="status" tone={statusTone(accountStatusTones, candidate.accounts.status)}>{displayLabel(accountStatusLabels, candidate.accounts.status)}</Badge> : "Perfil asistido sin cuenta vinculada"}</p>
        <p>Derivación: <strong>{referralEligible ? "Puede evaluarse" : "No disponible actualmente"}</strong></p>
        <p>Localidad: {candidate.locality ?? "Sin informar"}</p>
        <p className="flex flex-wrap items-center gap-2">Disponibilidad <Badge variant="status" tone={statusTone(availabilityTones, candidate.availability)}>{availabilityLabel(candidate.availability)}</Badge></p>
        <p>Vigencia hasta: {candidate.refresh_due_at ? formatFunesDate(candidate.refresh_due_at) : "Sin definir"}</p>
        <p>Habilidades: {candidate.skills_experience_summary ?? "Sin informar"}</p>
        <p>Categorías: <CategoryLabels categories={candidate.candidate_categories.flatMap(item => item.job_categories?.name ? [{ name: item.job_categories.name }] : [])} fallback="Sin categorías" /></p>
      </section>;
  const candidateCv = candidate.status !== "archived" && <section aria-labelledby="candidate-cv" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="candidate-cv" className="text-xl font-semibold">CV PDF del candidato</h2>
        {currentCv ? <>
          <p>CV vigente: <strong>{currentCv.original_name_safe}</strong></p>
          <p className="text-sm text-muted-foreground">PDF · {new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(currentCv.byte_size / 1024)} KB</p>
          <RecordAnchor href={`/api/cv/${currentCv.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Abrir CV vigente en otra pestaña</RecordAnchor>
        </> : <p>El candidato no tiene un CV vigente.</p>}
        {cv && <p role={cv === "ok" ? "status" : "alert"}>{cv === "ok" ? "CV guardado." : cv === "conflict" ? "El perfil cambió. Recargá antes de cargarlo." : "El PDF fue rechazado; el CV vigente no cambió."}</p>}
        {editable && <div className="space-y-3 border-t border-border pt-3">
          <h3 className="font-semibold">Cargar o reemplazar CV</h3>
          <p>La carga conserva las versiones anteriores usadas en derivaciones.</p>
          <CvUploadForm candidateId={candidateId} version={editable.profile.version} label="Archivo de CV" buttonLabel="Cargar CV" />
        </div>}
      </section>;

  return <AdminShell email={user?.email} active={assisted ? "/admin/atencion-presencial" : "/admin/candidates"} title={candidate.display_name}
    description="Perfil laboral y participaciones. La empresa no puede consultar este padrón."
    navigation={[{ href: assisted ? "/admin/atencion-presencial" : "/admin/candidates", label: assisted ? "Volver a perfil asistido" : "Volver a candidatos" }, { href: "/admin/openings", label: "Ofertas" }, { href: `/admin/courses?candidate=${encodeURIComponent(courseReference)}`, label: "Cursos y derivaciones" }]}>
    <div className={layout.grid} data-detail-grid="candidate">
      {editable && <>
        <div className={`${layout.cell} ${layout.full} ${layout.fieldPairs}`}>
          <AssistedProfileForm key={`assisted-profile:${candidateId}:${editable.profile.version}`} candidateId={candidateId}
            version={editable.profile.version} categories={maintenance!.categories} initial={editable.data} />
        </div>
        <div className={layout.cell} data-detail-cell="activation">
          <AssistedCommands key={`consent:${editable.profile.version}`} candidateId={candidateId} version={editable.profile.version}
            status={editable.profile.status} />
        </div>
        <div className={layout.cell} data-detail-cell="claim">
          <ClaimForm key={`claim:${editable.profile.version}`} candidateId={candidateId} version={editable.profile.version} requests={editable.requests} />
        </div>
      </>}
      <div className={`${layout.cell} ${!candidateCv ? layout.full : ""}`} data-detail-cell="profile">{profileDetails}</div>
      {candidateCv && <div className={layout.cell} data-detail-cell="cv">{candidateCv}</div>}
      <div className={layout.cell} data-detail-cell="note-form">
      <InternalNoteForm key={`${candidate.id}:${candidate.version}`} candidateId={candidate.id}
        version={candidate.version} onSubmit={recordEvaluationAction} />
      </div>
      <section aria-labelledby="candidate-notes" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5" data-detail-cell="notes">
        <h2 id="candidate-notes" className="scroll-mt-24 text-lg font-semibold">Notas internas</h2>
        {notes.length === 0 ? <EmptyState title={notesPage > 1 ? "Página sin notas" : "Sin notas"} description={notesPage > 1 ? "No hay notas en esta página. Volvé a una página anterior." : "Todavía no hay notas para este perfil."} /> :
          <ul className="space-y-3">{notes.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
            <p><strong>{item.note_kind === "training_guidance" ? "Orientación y capacitación" : "Nota sobre postulante"}</strong> · {formatFunesDateTime(item.created_at)}</p>
            <p className="whitespace-pre-wrap">{item.body}</p>
          </li>)}</ul>}
        {(notesPage > 1 || notesHasNext) && <Pagination aria-label="Páginas de notas internas">
          <PaginationContent>
            {notesPage > 1 && <PaginationItem><PaginationPrevious href={`/admin/candidates/${courseReference}?notesPage=${notesPage - 1}#candidate-notes`} /></PaginationItem>}
            <PaginationItem><span className="px-2 text-sm">Página {notesPage}</span></PaginationItem>
            {notesHasNext && <PaginationItem><PaginationNext href={`/admin/candidates/${courseReference}?notesPage=${notesPage + 1}#candidate-notes`} /></PaginationItem>}
          </PaginationContent>
        </Pagination>}
      </section>
      <div className={layout.cell} data-detail-cell="history"><CandidateHistory key={`history:${candidate.id}:${candidate.version}:${audit[0]?.id ?? "empty"}`}
        candidateId={candidate.id} initialEvents={audit} initialCursor={nextAuditCursor ?? null} />
      </div>
      <section aria-labelledby="candidate-participations" className={`${layout.surface} space-y-4`} data-detail-cell="participations">
        <h2 id="candidate-participations" className="text-xl font-semibold">Participaciones recientes</h2>
        <Link href={`/admin/participations?candidateId=${courseReference}`} className="inline-flex min-h-11 items-center font-semibold underline">Ver todas las participaciones</Link>
        {participations.length === 0 ? <EmptyState title="Sin participaciones" description="Aún no hay postulaciones o nominaciones para este perfil." /> :
          <ul className="space-y-3">{participations.map((item) => <li key={item.id} className="rounded-lg border border-slate-300 bg-white p-4">
            <Link href={`/admin/participations/${item.id}`} className="font-semibold text-blue-800 underline">{item.job_openings?.title ?? "Oferta sin título"}</Link>
            <p className="text-sm">{participationStatusLabel(item.status)} · {item.origin === "admin_nomination" ? "Nominación administrativa" : "Postulación"}</p>
          </li>)}</ul>}
      </section>
      {candidate.account_id && candidate.accounts && candidate.accounts.status !== "pending_verification" &&
        <div className={`${layout.cell} ${layout.full}`}><SafetyDecisionForm key={`${candidate.accounts.status}-${candidate.accounts.version}`}
          resource="candidate_account" resourceId={candidate.account_id}
          version={candidate.accounts.version}
          action={candidate.accounts.status === "active" ? "suspend" : candidate.accounts.status === "suspended" ? "reactivate" : "restore"}
          onSubmit={candidateAccountDecisionAction} /></div>}
    </div>
  </AdminShell>;
}
