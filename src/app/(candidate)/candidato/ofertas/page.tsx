import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { getPublicOffer, listPublicOffers } from "@/features/openings/public-service";
import { CandidateApplyForm } from "@/features/participations/components/candidate-status";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { AppError } from "@/lib/errors/public-error";

export const dynamic = "force-dynamic";
export default async function CandidateOffersPage({ searchParams }: { searchParams: Promise<{ page?: string; oferta?: string }> }) {
  await requireActiveAccount(["candidate"]);
  const { page, oferta } = await searchParams;
  const [workspace, offers, participations] = await Promise.all([
    getCandidateWorkspace(), listPublicOffers({ page: page ?? 1 }), listMyParticipations(),
  ]);
  const joinedOfferIds = new Set(participations.map((item) => item.opening_id));
  let selectedOffer: Awaited<ReturnType<typeof getPublicOffer>> | null = null;
  if (oferta) {
    try { selectedOffer = await getPublicOffer(oferta); }
    catch (error) { if (!(error instanceof AppError && error.code === "NOT_FOUND")) throw error; }
  }
  const enabled = workspace.bootstrap === "ready" && workspace.profile?.status === "active" && workspace.cv !== null &&
    workspace.consent?.status === "accepted" && workspace.profile?.availability === "available";
  return <RoleShell role="candidate" title="Ofertas para postularme"
    navigation={[{ href: "/candidato/perfil", label: "Mi perfil" }, { href: "/candidato/postulaciones", label: "Mis participaciones" }]}>
    {!enabled && <p role="status" className="rounded bg-amber-50 p-4">Para postularte necesitás el perfil activo, disponible, con consentimiento vigente y CV válido. <Link href="/candidato/perfil" className="text-blue-800 underline">Revisar perfil</Link></p>}
    {oferta && !selectedOffer && <p role="status" className="mt-5 rounded border border-amber-300 bg-amber-50 p-4">La oferta elegida ya no está disponible para postularse.</p>}
    {selectedOffer && <section aria-label="Oferta elegida" className="mt-5 rounded border-2 border-blue-800 bg-white p-5">
      <h2 className="text-lg font-semibold">Oferta elegida: {selectedOffer.title}</h2>
      <p>{selectedOffer.company_name} · {selectedOffer.location} · Cierre: {selectedOffer.closing_date}</p>
      {workspace.profile && <CandidateApplyForm openingId={selectedOffer.id} candidateVersion={workspace.profile.version}
        disabled={!enabled} alreadyApplied={joinedOfferIds.has(selectedOffer.id)} />}
    </section>}
    {offers.items.length === 0 ? <p className="mt-5">No hay ofertas vigentes en esta página.</p> :
      <ul className="mt-5 grid gap-4">{offers.items.filter((offer) => offer.id !== selectedOffer?.id).map((offer) => <li key={offer.id} className="rounded border bg-white p-5">
        <Link href={`/ofertas/${offer.id}`} className="text-lg font-semibold text-blue-800 underline">{offer.title}</Link>
        <p>{offer.company_name} · {offer.location} · Cierre: {offer.closing_date}</p>
        {workspace.profile && <CandidateApplyForm openingId={offer.id} candidateVersion={workspace.profile.version}
          disabled={!enabled} alreadyApplied={joinedOfferIds.has(offer.id)} />}
      </li>)}</ul>}
    <nav aria-label="Páginas de ofertas" className="mt-6 flex gap-5">
      {offers.page > 1 && <Link className="text-blue-800 underline" href={`/candidato/ofertas?page=${offers.page - 1}`}>Anterior</Link>}
      {offers.page * offers.pageSize < offers.total && <Link className="text-blue-800 underline" href={`/candidato/ofertas?page=${offers.page + 1}`}>Siguiente</Link>}
    </nav>
  </RoleShell>;
}
