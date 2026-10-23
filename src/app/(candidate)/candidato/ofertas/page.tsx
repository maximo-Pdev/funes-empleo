import { CandidateShell } from "../_components/candidate-shell";
import { renderCandidateOffersContent } from "../_components/offers-content";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";

export const dynamic = "force-dynamic";
export default async function CandidateOffersPage({ searchParams }: { searchParams: Promise<{ page?: string; oferta?: string }> }) {
  await requireActiveAccount(["candidate"]);
  const { page, oferta } = await searchParams;
  const workspace = await getCandidateWorkspace();
  return <CandidateShell title="Ofertas para postularme" active="/candidato/ofertas"
    description="Explorá las ofertas vigentes y enviá tu postulación. La Oficina de Empleo acompaña el proceso de selección.">
    {await renderCandidateOffersContent({ workspace, page, oferta })}
  </CandidateShell>;
}
