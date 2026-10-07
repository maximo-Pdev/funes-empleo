import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, MapPin, ShieldCheck, CircleAlert } from "lucide-react";
import { Card } from "@/components/ui";
import { CandidateShell } from "../_components/candidate-shell";
import styles from "../_components/candidate-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { getPublicOffer, listPublicOffers, type PublicOffer } from "@/features/openings/public-service";
import { CandidateApplyForm } from "@/features/participations/components/candidate-status";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { AppError } from "@/lib/errors/public-error";

export const dynamic = "force-dynamic";
function OfferSummary({ offer }: { offer: PublicOffer }) {
  return <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
    <p className="font-semibold text-foreground">{offer.company_name}</p>
    <p className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{offer.location}</p>
    <p className="flex items-start gap-2"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Cierre: {offer.closing_date}</p>
  </div>;
}
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
  return <CandidateShell title="Ofertas para postularme" active="/candidato/ofertas"
    description="Explorá las ofertas vigentes y enviá tu postulación. La Oficina de Empleo acompaña el proceso de selección.">
    {!enabled && <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
      <CircleAlert className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">Revisá tu perfil antes de postularte</p><p className="mt-2 text-sm leading-6">Para postularte necesitás el perfil activo, disponible, con consentimiento vigente y CV válido.</p><Link href="/candidato/perfil" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold underline underline-offset-4">Revisar perfil<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    </div>}
    {oferta && !selectedOffer && <p role="status" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5 leading-7 text-amber-950">La oferta elegida ya no está disponible para postularse.</p>}
    {selectedOffer && <section aria-label="Oferta elegida" className="mb-6 rounded-xl border-2 border-primary bg-surface p-6 sm:p-8">
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700"><BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />Tu oferta seleccionada</p>
      <h2 className="break-words text-xl font-bold text-primary-900">Oferta elegida: {selectedOffer.title}</h2>
      <OfferSummary offer={selectedOffer} />
      {workspace.profile && <div className={`${styles.forms} ${styles.apply} mt-5 max-w-md`}><CandidateApplyForm openingId={selectedOffer.id} candidateVersion={workspace.profile.version}
        disabled={!enabled} alreadyApplied={joinedOfferIds.has(selectedOffer.id)} /></div>}
    </section>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-primary-900">Ofertas vigentes</h2><p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Revisadas por la Oficina</p></div>
    {offers.items.length === 0 ? <Card className="p-8 text-center sm:p-12"><BriefcaseBusiness className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /><h3 className="mt-4 text-xl font-bold text-primary-900">No hay ofertas vigentes en esta página.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Podés volver a consultar más adelante y mantener tu perfil actualizado.</p><Link href="/candidato/perfil" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-secondary">Ir a mi perfil<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card> :
      <ul className="grid gap-5 md:grid-cols-2">{offers.items.filter((offer) => offer.id !== selectedOffer?.id).map((offer) => <li key={offer.id} className="min-w-0">
        <Card className="flex h-full flex-col p-6"><h3 className="break-words text-xl font-bold leading-7"><Link href={`/ofertas/${offer.id}`} className="rounded-sm text-primary-900 underline decoration-border underline-offset-4 hover:decoration-primary">{offer.title}</Link></h3>
          <OfferSummary offer={offer} />
          {workspace.profile && <div className={`${styles.forms} ${styles.apply} mt-auto pt-5`}><CandidateApplyForm openingId={offer.id} candidateVersion={workspace.profile.version}
            disabled={!enabled} alreadyApplied={joinedOfferIds.has(offer.id)} /></div>}
        </Card>
      </li>)}</ul>}
    <nav aria-label="Páginas de ofertas" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      {offers.page > 1 && <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-secondary" href={`/candidato/ofertas?page=${offers.page - 1}`}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Anterior</Link>}
      <p className="text-sm text-muted-foreground">Página {offers.page}</p>
      {offers.page * offers.pageSize < offers.total && <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-secondary" href={`/candidato/ofertas?page=${offers.page + 1}`}>Siguiente<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </nav>
  </CandidateShell>;
}
