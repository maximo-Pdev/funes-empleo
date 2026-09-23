import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { EmptyState, FeedbackMessage } from "@/components/ui";
import { getAdminParticipation } from "@/features/participations/admin-query";
import { ParticipationTimeline } from "@/features/participations/components/participation-timeline";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

function localDate(value: string) {
  return new Date(value).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" });
}

export default async function AdminParticipationDetailPage({ params }: {
  params: Promise<{ participationId: string }>;
}) {
  await requireActiveAccount(["admin"]);
  const { participationId } = await params;
  const { participation, audit, preinterviews, contacts, notes, referral, feedback } =
    await getAdminParticipation(participationId);

  return <RoleShell role="admin" title="Seguimiento de participación"
    description="Estado vigente, decisiones y registros internos de este caso."
    navigation={[{ href: "/admin/participations", label: "Volver a casos" }, { href: "/admin/openings", label: "Ofertas" }]}>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <section aria-labelledby="participation-details" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="participation-details" className="text-xl font-semibold">Caso</h2>
          <p>Candidato: <Link href={`/admin/candidates/${participation.candidate_profiles.id}`} className="text-blue-800 underline">{participation.candidate_profiles.display_name}</Link></p>
          <p>Oferta: <Link href={`/admin/openings/${participation.job_openings.id}`} className="text-blue-800 underline">{participation.job_openings.title ?? "Oferta sin título"}</Link></p>
          <p>Origen: {participation.origin === "admin_nomination" ? "Nominación administrativa" : "Postulación"}</p>
          <p>Ingresó: {localDate(participation.created_at)}</p>
          <p>Respuesta esperada: {participation.feedback_due_at ? localDate(participation.feedback_due_at) : "Aún no derivada"}</p>
          {referral && <p>Acceso empresarial: <strong>{referral.access_status === "active" ? "Activo bajo condiciones vigentes" : "Revocado"}</strong></p>}
          {referral?.post_hire_access_until && <p>Fin de ventana poscontratación: {localDate(referral.post_hire_access_until)}</p>}
        </section>
        <ParticipationTimeline currentStatus={participation.status} events={audit.map((event) => ({
          id: event.id, occurredAt: event.occurred_at, action: event.action,
          actorLabel: event.actor_type === "system" ? "Sistema" : `Cuenta ${event.actor_account_id ?? "sin identificar"}`,
          previousStatus: event.previous_state, newStatus: event.new_state,
          reason: event.reason_code,
        }))} />
      </div>
      <div className="space-y-6">
        <section aria-labelledby="preinterviews-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="preinterviews-title" className="text-xl font-semibold">Preentrevistas</h2>
          {preinterviews.length === 0 ? <EmptyState title="Sin preentrevistas" description="Todavía no se registró una preentrevista." /> :
            <ul className="space-y-3">{preinterviews.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>{item.channel}</strong> · {localDate(item.created_at)}</p>
              {item.summary_internal && <p className="whitespace-pre-wrap">{item.summary_internal}</p>}
            </li>)}</ul>}
        </section>
        <section aria-labelledby="feedback-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="feedback-title" className="text-xl font-semibold">Feedback empresarial</h2>
          {feedback.length === 0 ? <EmptyState title="Sin feedback" description="La empresa todavía no comunicó un resultado." /> :
            <ul className="space-y-3">{feedback.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>{item.reported_outcome.replaceAll("_", " ")}</strong> · {localDate(item.reported_at)}</p>
              <p>{item.review_status === "pending_admin" ? "Pendiente de confirmación administrativa" : "Revisado"}</p>
              {item.message && <p className="whitespace-pre-wrap">{item.message}</p>}
            </li>)}</ul>}
          {feedback.some((item) => item.review_status === "pending_admin") && <FeedbackMessage tone="info">Un resultado informado por la empresa no cambia el resultado final hasta la confirmación de la Oficina.</FeedbackMessage>}
        </section>
        <section aria-labelledby="internal-records-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
          <h2 id="internal-records-title" className="text-xl font-semibold">Contactos y notas internas</h2>
          {contacts.length === 0 && notes.length === 0 ? <EmptyState title="Sin registros internos" description="No hay contactos ni notas relacionados con este caso." /> : <>
            <ul className="space-y-3">{contacts.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>Contacto {item.channel}</strong> · {localDate(item.occurred_at)}</p>
              <p className="whitespace-pre-wrap">{item.summary_internal}</p>
            </li>)}{notes.map((item) => <li key={item.id} className="border-t border-slate-200 pt-3">
              <p><strong>{item.note_kind === "training_guidance" ? "Orientación y capacitación" : "Nota sobre postulante"}</strong> · {localDate(item.created_at)}</p>
              <p className="whitespace-pre-wrap">{item.body}</p>
            </li>)}</ul>
          </>}
        </section>
      </div>
    </div>
  </RoleShell>;
}
