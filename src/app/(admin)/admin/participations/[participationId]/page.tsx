import { WorkflowSteps } from "@/components/ui/workflow-steps";
import { adminWorkflow } from "@/domain/presentation/workflow-steps";
import { formatFunesDateTime } from "@/lib/time/presentation";
import { recordReferences } from "@/lib/records/references";
import { pageRecordIdentifier } from "@/lib/records/page-references";
import { contactChannelLabels, feedbackOutcomeLabels, displayLabel, referralAccessLabels } from "@/domain/presentation/labels";
import { feedbackReviewTones, referralAccessTones, statusTone } from "@/domain/presentation/status-tone";
import { RecordLink as Link, RecordAnchor } from "@/components/ui/record-link";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { Badge, EmptyState, FeedbackMessage } from "@/components/ui";
import { getAdminParticipation } from "@/features/participations/admin-query";
import { ParticipationActionForm } from "@/features/participations/components/participation-action-form";
import { ContactRecordForm } from "@/features/participations/components/contact-record-form";
import { FeedbackReviewPanel } from "@/features/participations/components/feedback-review-panel";
import { ParticipationTimeline } from "@/features/participations/components/participation-timeline";
import { getContactTimeline } from "@/features/participations/contact-service";
import { ContactTimeline } from "@/features/participations/components/contact-timeline";
import { ContactTools } from "@/features/participations/components/contact-tools";
import { adminParticipationAction, confirmFeedbackAction, recordEvaluationAction } from "@/features/participations/evaluation-actions";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

function localDate(value: string) {
  return formatFunesDateTime(value);
}

export default async function AdminParticipationDetailPage({ params }: {
  params: Promise<{ participationId: string }>;
}) {
  const { user } = await requireActiveAccount(["admin"]);
  const { participationId: reference } = await params;
  const participationId = await pageRecordIdentifier("participation", reference, `/admin/participations/${reference}`);
  const { participation, audit, preinterviews, contacts, notes, referral, feedback } =
    await getAdminParticipation(participationId);
  const contactHistory = await getContactTimeline(participationId);

  const guidance = adminWorkflow(participation.status, feedback.some(item => item.review_status === "pending_admin"));
  const actors = await recordReferences("account", audit.map(event => event.actor_account_id));

  return <AdminShell email={user?.email} active="/admin/participations" title="Seguimiento de participación"
    description="Estado vigente, decisiones y registros internos de este caso."
    navigation={[{ href: "/admin/participations", label: "Volver a casos" }, { href: "/admin/openings", label: "Ofertas" }]}>
        <section aria-labelledby="participation-details" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="participation-details" className="text-xl font-semibold">Caso</h2>
          <p>Candidato: <Link href={`/admin/candidates/${participation.candidate_profiles.id}`} className="text-blue-800 underline">{participation.candidate_profiles.display_name}</Link></p>
          <p>Oferta: <Link href={`/admin/openings/${participation.job_openings.id}`} className="text-blue-800 underline">{participation.job_openings.title ?? "Oferta sin título"}</Link></p>
          <p>Origen: {participation.origin === "admin_nomination" ? "Nominación administrativa" : "Postulación"}</p>
          {participation.application_cv && !participation.application_cv.archived_at && ["valid", "superseded"].includes(participation.application_cv.status)
            ? <p><RecordAnchor href={`/api/cv/${participation.application_cv.id}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Abrir CV de esta postulación: {participation.application_cv.original_name_safe}</RecordAnchor></p>
            : <p>{participation.application_cv_document_id ? "El CV seleccionado ya no está disponible." : "Sin CV seleccionado al ingresar: se usará el vigente al derivar."}</p>}
          <p>Ingresó: {localDate(participation.created_at)}</p>
          <p>Respuesta esperada: {participation.feedback_due_at ? localDate(participation.feedback_due_at) : "Aún no derivada"}</p>
          {referral && <p className="flex flex-wrap items-center gap-2">Acceso empresarial <Badge variant="status" tone={statusTone(referralAccessTones, referral.access_status)}>{displayLabel(referralAccessLabels, referral.access_status)}</Badge>{referral.access_status === "active" ? <span className="text-sm text-muted-foreground">bajo condiciones vigentes</span> : null}</p>}
          {referral?.post_hire_access_until && <p>Fin de ventana poscontratación: {localDate(referral.post_hire_access_until)}</p>}
        </section>

    <section aria-label="Próximo paso" className="my-6 rounded-lg border border-border p-5">
      <WorkflowSteps label="Etapas del caso" steps={guidance.steps} />
      <p>{guidance.description}</p>
      {guidance.target && <a href={guidance.target} className="inline-flex min-h-11 items-center text-primary underline">Ir a la acción disponible</a>}
    </section>
    <div id="feedback-review" tabIndex={-1} className="mb-6 scroll-mt-24">
        <FeedbackReviewPanel key={`feedback:${participation.id}:${participation.version}`}
          participationId={participation.id} version={participation.version}
          currentStatus={participation.status}
          feedback={feedback.map((item) => ({ id: item.id, reportedOutcome: item.reported_outcome,
            reportedAt: item.reported_at,
            reviewStatus: item.review_status === "accepted" ? "accepted" as const :
              item.review_status === "superseded" ? "superseded" as const : "pending_admin" as const,
            message: item.message }))}
          onConfirm={confirmFeedbackAction} />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div id="case-actions" tabIndex={-1} className="scroll-mt-24">
        <ParticipationActionForm key={`${participation.id}:${participation.version}`} participationId={participation.id}
          version={participation.version} status={participation.status}
          contacts={contacts.map((item) => ({ id: item.id, direction: item.direction,
            label: `${localDate(item.occurred_at)} · ${displayLabel(contactChannelLabels, item.channel, "Canal no informado")} · ${item.summary_internal.slice(0, 60)}` }))}
          feedback={feedback.filter((item) => item.review_status === "pending_admin")
            .map((item) => ({ id: item.id,
              label: `${localDate(item.reported_at)} · ${displayLabel(feedbackOutcomeLabels, item.reported_outcome, "Respuesta informada")}` }))}
          onSubmit={adminParticipationAction} />
        </div>
        <div id="contact-record" tabIndex={-1} className="scroll-mt-24">
        <ContactRecordForm key={`contact:${participation.id}:${participation.version}`}
          participationId={participation.id} version={participation.version}
          onSubmit={recordEvaluationAction} />
        </div>
        <ParticipationTimeline currentStatus={participation.status} events={audit.map((event) => ({
          id: event.event_id, occurredAt: event.occurred_at, action: event.action,
          actorLabel: event.actor_type === "system" ? "Sistema" : `Cuenta ${(event.actor_account_id ? actors[event.actor_account_id] : undefined) ?? "sin identificar"}`,
          previousStatus: event.previous_state, newStatus: event.new_state,
          reason: event.reason, reasonCode: event.reason_code,
        }))} />
      </div>
      <div className="space-y-6">
        <ContactTimeline contacts={contactHistory} />
        <ContactTools />
        <section aria-labelledby="preinterviews-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="preinterviews-title" className="text-xl font-semibold">Preentrevistas</h2>
          {preinterviews.length === 0 ? <EmptyState title="Sin preentrevistas" description="Todavía no se registró una preentrevista." /> :
            <ul className="space-y-3">{preinterviews.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>{displayLabel(contactChannelLabels, item.channel, "Canal no informado")}</strong> · {localDate(item.created_at)}</p>
              {item.summary_internal && <p className="whitespace-pre-wrap">{item.summary_internal}</p>}
            </li>)}</ul>}
        </section>
        <section aria-labelledby="feedback-history-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="feedback-history-title" className="text-xl font-semibold">Respuesta empresarial</h2>
          {feedback.length === 0 ? <EmptyState title="Sin respuesta" description="La empresa todavía no comunicó un resultado." /> :
            <ul className="space-y-3">{feedback.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>{displayLabel(feedbackOutcomeLabels, item.reported_outcome, "Respuesta informada")}</strong> · {localDate(item.reported_at)}</p>
              <p className="flex flex-wrap items-center gap-2"><Badge variant="status" tone={statusTone(feedbackReviewTones, item.review_status)}>{item.review_status === "pending_admin" ? "Pendiente de confirmación administrativa" : "Revisado"}</Badge></p>
              {item.message && <p className="whitespace-pre-wrap">{item.message}</p>}
            </li>)}</ul>}
          {feedback.some((item) => item.review_status === "pending_admin") && <FeedbackMessage tone="info">Un resultado informado por la empresa no cambia el resultado final hasta la confirmación de la Oficina.</FeedbackMessage>}
        </section>
        <section aria-labelledby="internal-records-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="internal-records-title" className="text-xl font-semibold">Notas internas</h2>
          {notes.length === 0 ? <EmptyState title="Sin notas internas" description="No hay notas relacionadas con este caso." /> : <>
            <ul className="space-y-3">{notes.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>{item.note_kind === "training_guidance" ? "Orientación y capacitación" : "Nota sobre postulante"}</strong> · {localDate(item.created_at)}</p>
              <p className="whitespace-pre-wrap">{item.body}</p>
            </li>)}</ul>
          </>}
        </section>
      </div>
    </div>
  </AdminShell>;
}
