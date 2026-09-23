import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { EmptyState } from "@/components/ui";
import { getAdminCandidate } from "@/features/candidates/search-service";
import { candidateAccountDecisionAction } from "@/features/candidates/admin-actions";
import { participationStatusLabel } from "@/features/participations/components/participation-timeline";
import { SafetyDecisionForm } from "@/features/participations/components/safety-decision-form";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminCandidateDetailPage({ params }: {
  params: Promise<{ candidateId: string }>;
}) {
  await requireActiveAccount(["admin"]);
  const { candidateId } = await params;
  const { candidate, referralEligible, participations, audit } = await getAdminCandidate(candidateId);

  return <RoleShell role="admin" title={candidate.display_name}
    description="Perfil laboral y participaciones. La empresa no puede consultar este padrón."
    navigation={[{ href: "/admin/candidates", label: "Volver a candidatos" }, { href: "/admin/openings", label: "Ofertas" }]}>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
      <section aria-labelledby="candidate-details" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="candidate-details" className="text-xl font-semibold">Perfil candidato</h2>
        <p>Estado: <strong>{candidate.status.replaceAll("_", " ")}</strong></p>
        <p>Cuenta: {candidate.accounts?.status ?? "Perfil asistido sin cuenta vinculada"}</p>
        <p>Derivación: <strong>{referralEligible ? "Puede evaluarse" : "No disponible actualmente"}</strong></p>
        <p>Localidad: {candidate.locality ?? "Sin informar"}</p>
        <p>Disponibilidad: {candidate.availability ?? "Sin informar"}</p>
        <p>Vigencia hasta: {candidate.refresh_due_at ?? "Sin definir"}</p>
        <p>Habilidades: {candidate.skills_experience_summary ?? "Sin informar"}</p>
        <p>Categorías: {candidate.candidate_categories.map((item) => item.job_categories?.name).filter(Boolean).join(", ") || "Sin categorías"}</p>
      </section>
      <section aria-labelledby="candidate-history" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="candidate-history" className="text-xl font-semibold">Historial de cuenta y perfil</h2>
        {audit.length === 0 ? <EmptyState title="Sin eventos" description="Todavía no hay movimientos registrados." /> :
          <ol className="space-y-3">{audit.map((event) => <li key={event.id} className="border-t border-slate-200 pt-3">
            <p className="font-semibold">{event.action.replaceAll("_", " ")}</p>
            <p className="text-sm">{event.previous_state ?? "inicio"} → {event.new_state ?? "sin cambio de estado"}</p>
            <p className="text-sm text-slate-700">{new Date(event.occurred_at).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })} · {event.actor_type === "system" ? "Sistema" : `Cuenta ${event.actor_account_id ?? "sin identificar"}`}</p>
            {event.reason_code && <p className="text-sm">Código de motivo: {event.reason_code}</p>}
          </li>)}</ol>}
      </section>
      </div>
      <div className="space-y-6">
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
  </RoleShell>;
}
