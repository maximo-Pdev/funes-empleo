import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getAssistedWorkspace } from "@/features/candidates/assisted-service";
import { AssistedProfileForm, AssistedCommands, ClaimForm } from "@/features/candidates/components/assisted/assisted-forms";
import { InternalNoteForm } from "@/features/participations/components/internal-note-form";
import { recordEvaluationAction } from "@/features/participations/evaluation-actions";
import { candidateProfileStatusLabels } from "@/features/candidates/candidate-profile-status";
export const dynamic = "force-dynamic";
export default async function AssistedDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
  await requireActiveAccount(["admin"]);
  const { candidateId } = await params;
  const { categories, workspace } = await getAssistedWorkspace(candidateId);
  if (!workspace) return null;
  const { profile, data, requests, consent, policy } = workspace;
  return <RoleShell role="admin" title={`Atención de ${profile.display_name}`} description="Mantenimiento presencial, consentimiento y vinculación de cuenta."
    navigation={[{ href: `/admin/candidates/${candidateId}`, label: "Perfil, CV e historial" }, { href: "/admin/candidates", label: "Candidatos" }]}>
    <p role="status">Estado: {candidateProfileStatusLabels[profile.status]}. {profile.account_id ? "Cuenta vinculada." : "Sin cuenta vinculada."}</p>
    <div className="grid gap-6 lg:grid-cols-2"><AssistedProfileForm key={`${candidateId}:${profile.version}`} candidateId={candidateId} version={profile.version} categories={categories} initial={data} />
      <div className="space-y-6"><AssistedCommands candidateId={candidateId} version={profile.version} status={profile.status} consent={consent} policy={policy} />
        <InternalNoteForm candidateId={candidateId} version={profile.version} onSubmit={recordEvaluationAction} />
        <Link className="block rounded border bg-white p-4 text-blue-800 underline" href={`/admin/candidates/${candidateId}`}>Cargar CV, consultar notas e historial y nominar a una oferta</Link>
        {profile.origin === "assisted" && !profile.account_id && <ClaimForm candidateId={candidateId} version={profile.version} requests={requests} />}
      </div></div>
  </RoleShell>;
}
