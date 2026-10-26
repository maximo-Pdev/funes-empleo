import { pageRecordIdentifier } from "@/lib/records/page-references";
import { RecordLink as Link, RecordAnchor } from "@/components/ui/record-link";
import { candidateProfileStatusLabels, accountStatusLabels, displayLabel, availabilityLabel } from "@/domain/presentation/labels";
import { accountStatusTones, availabilityTones, candidateProfileStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { Badge, EmptyState } from "@/components/ui";
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

export const dynamic = "force-dynamic";

export default async function AdminCandidateDetailPage({ params, searchParams }: {
  params: Promise<{ candidateId: string }>; searchParams: Promise<{ cv?: string }>;
}) {
  const { user } = await requireActiveAccount(["admin"]);
  const { candidateId: reference } = await params;
  const candidateId = await pageRecordIdentifier("candidate", reference, `/admin/candidates/${reference}`, await searchParams);
  const { cv } = await searchParams;
  const { candidate, currentCv, referralEligible, participations, notes, audit, nextAuditCursor } = await getAdminCandidate(candidateId);

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
        <p>Vigencia hasta: {candidate.refresh_due_at ?? "Sin definir"}</p>
        <p>Habilidades: {candidate.skills_experience_summary ?? "Sin informar"}</p>
        <p>Categorías: {candidate.candidate_categories.map((item) => item.job_categories?.name).filter(Boolean).join(", ") || "Sin categorías"}</p>
      </section>;
  const candidateCv = candidate.status !== "archived" && <section aria-labelledby="candidate-cv" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="candidate-cv" className="text-xl font-semibold">CV PDF del candidato</h2>
        {currentCv ? <>
          <p>CV vigente: <strong>{currentCv.original_name_safe}</strong></p>
          <p className="text-sm text-muted-foreground">PDF · {new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(currentCv.byte_size / 1024)} KB</p>
          <RecordAnchor href={`/api/cv/${currentCv.id}`} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Descargar CV vigente</RecordAnchor>
        </> : <p>El candidato no tiene un CV vigente.</p>}
        {cv && <p role={cv === "ok" ? "status" : "alert"}>{cv === "ok" ? "CV guardado." : cv === "conflict" ? "El perfil cambió. Recargá antes de cargarlo." : "El PDF fue rechazado; el CV vigente no cambió."}</p>}
        {editable && <div className="space-y-3 border-t border-border pt-3">
          <h3 className="font-semibold">Cargar o reemplazar CV</h3>
          <p>La carga conserva las versiones anteriores usadas en derivaciones.</p>
          <CvUploadForm candidateId={candidateId} version={editable.profile.version} label="Archivo PDF" buttonLabel="Cargar CV" />
        </div>}
      </section>;

  return <AdminShell email={user?.email} active={assisted ? "/admin/atencion-presencial" : "/admin/candidates"} title={candidate.display_name}
    description="Perfil laboral y participaciones. La empresa no puede consultar este padrón."
    navigation={[{ href: assisted ? "/admin/atencion-presencial" : "/admin/candidates", label: assisted ? "Volver a perfil asistido" : "Volver a candidatos" }, { href: "/admin/openings", label: "Ofertas" }]}>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
      {editable && <AssistedProfileForm key={`assisted-profile:${candidateId}:${editable.profile.version}`} candidateId={candidateId}
        version={editable.profile.version} categories={maintenance!.categories} initial={editable.data} />}
      {profileDetails}
      {candidateCv}
      <InternalNoteForm key={`${candidate.id}:${candidate.version}`} candidateId={candidate.id}
        version={candidate.version} onSubmit={recordEvaluationAction} />
      <section aria-labelledby="candidate-notes" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="candidate-notes" className="text-lg font-semibold">Notas internas</h2>
        {notes.length === 0 ? <EmptyState title="Sin notas" description="Todavía no hay notas para este perfil." /> :
          <ul className="space-y-3">{notes.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
            <p><strong>{item.note_kind === "training_guidance" ? "Orientación y capacitación" : "Nota sobre postulante"}</strong> · {new Date(item.created_at).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })}</p>
            <p className="whitespace-pre-wrap">{item.body}</p>
          </li>)}</ul>}
      </section>
      <CandidateHistory key={`history:${candidate.id}:${candidate.version}:${audit[0]?.id ?? "empty"}`}
        candidateId={candidate.id} initialEvents={audit} initialCursor={nextAuditCursor ?? null} />
      </div>
      <div className="space-y-6">
      {editable && <>
        <AssistedCommands key={`consent:${editable.profile.version}`} candidateId={candidateId} version={editable.profile.version}
          status={editable.profile.status} />
        <ClaimForm key={`claim:${editable.profile.version}`} candidateId={candidateId} version={editable.profile.version} requests={editable.requests} />
      </>}
      {candidate.account_id && candidate.accounts && candidate.accounts.status !== "pending_verification" &&
        <SafetyDecisionForm key={`${candidate.accounts.status}-${candidate.accounts.version}`}
          resource="candidate_account" resourceId={candidate.account_id}
          version={candidate.accounts.version}
          action={candidate.accounts.status === "active" ? "suspend" : candidate.accounts.status === "suspended" ? "reactivate" : "restore"}
          onSubmit={candidateAccountDecisionAction} />}
      <section aria-labelledby="candidate-participations" className="space-y-4">
        <h2 id="candidate-participations" className="text-xl font-semibold">Participaciones recientes</h2>
        {participations.length === 0 ? <EmptyState title="Sin participaciones" description="Aún no hay postulaciones o nominaciones para este perfil." /> :
          <ul className="space-y-3">{participations.map((item) => <li key={item.id} className="rounded-lg border border-slate-300 bg-white p-4">
            <Link href={`/admin/participations/${item.id}`} className="font-semibold text-blue-800 underline">{item.job_openings?.title ?? "Oferta sin título"}</Link>
            <p className="text-sm">{participationStatusLabel(item.status)} · {item.origin === "admin_nomination" ? "Nominación administrativa" : "Postulación"}</p>
          </li>)}</ul>}
      </section>
      </div>
    </div>
  </AdminShell>;
}
