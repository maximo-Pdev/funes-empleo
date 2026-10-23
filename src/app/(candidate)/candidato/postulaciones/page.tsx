import { CandidateShell } from "../_components/candidate-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { renderCandidateParticipationsContent } from "../_components/participations-content";

export const dynamic = "force-dynamic";
export default async function CandidateParticipationsPage() {
  await requireActiveAccount(["candidate"]);
  return <CandidateShell title="Mis participaciones" active="/candidato/postulaciones"
    description="La Oficina de Empleo revisa cada caso. Se muestra la recepción y el resultado final, sin etapas internas.">
    {await renderCandidateParticipationsContent()}
  </CandidateShell>;
}
