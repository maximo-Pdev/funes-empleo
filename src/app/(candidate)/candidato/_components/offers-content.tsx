import { formatCalendarDate } from "@/lib/time/presentation";
import Link from "next/link";
import { CategoryLabels } from "@/components/job-category-label";
import { publicModalityLabel } from "@/features/openings/public-offer-display";
import { ArrowRight, BriefcaseBusiness, CalendarDays, MapPin, ShieldCheck, CircleAlert } from "lucide-react";
import { Card, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import styles from "../_components/candidate-forms.module.css";
import layoutStyles from "@/app/(auth)/account/account.module.css";
import cardLayout from "@/components/ui/card-layout.module.css";
import type { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { getPublicOffer, listPublicOffers, type PublicOffer } from "@/features/openings/public-service";
import { CandidateApplyForm } from "@/features/participations/components/candidate-status";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { AppError } from "@/lib/errors/public-error";

function OfferSummary({ offer }: { offer: PublicOffer }) {
  return <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
    <p className="font-semibold text-foreground">{offer.company_name}</p>
    <p className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{offer.location}</p>
    <p className="flex items-start gap-2"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Cierre: {formatCalendarDate(offer.closing_date)}</p>
    <p>Modalidad: {publicModalityLabel(offer.modality)} · Vacantes: {offer.vacancies}</p>
    <p>Rubros: <CategoryLabels categories={offer.categories} fallback="Sin rubros informados" /></p>
  </div>;
}
export async function renderCandidateOffersContent({ workspace, page, oferta, profileHref = "/dashboard?section=perfil", offersHref = "/dashboard?section=ofertas" }: {
  workspace: Awaited<ReturnType<typeof getCandidateWorkspace>>;
  page?: string; oferta?: string; profileHref?: string; offersHref?: string;
}) {
  const [offers, participations] = await Promise.all([listPublicOffers({ page: page ?? 1 }), listMyParticipations()]);
  const pageHref = (number: number) => {
    const [path, query] = offersHref.split("?");
    const params = new URLSearchParams(query);
    params.set("page", String(number));
    if (oferta) params.set("oferta", oferta);
    return `${path}?${params}`;
  };
  const participationsHref = (slug: string) => {
    const [path, query] = offersHref.split("?");
    const params = new URLSearchParams(query);
    params.set("section", "postulaciones");
    params.delete("page");
    params.set("oferta", slug);
    return `${path}?${params}`;
  };
  const joinedOfferIds = new Set(participations.filter(item => item.display_status !== "withdrawn").map(item => item.opening_id));
  // Each attempt has a fresh form, without the previous submission's success state.
  const attemptKey = (openingId: string) => `${openingId}:${participations.filter(item => item.opening_id === openingId).map(item => `${item.id}:${item.display_status}`).sort().join(",")}`;
  let selectedOffer: Awaited<ReturnType<typeof getPublicOffer>> | null = null;
  if (oferta) {
    try { selectedOffer = await getPublicOffer(oferta); }
    catch (error) { if (!(error instanceof AppError && error.code === "NOT_FOUND")) throw error; }
  }
  const enabled = workspace.bootstrap === "ready" && workspace.profile?.status === "active" && workspace.cv !== null &&
    workspace.consent?.status === "accepted" && workspace.profile?.availability === "available";
  return <>
    {!enabled && <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
      <CircleAlert className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">Revisá tu perfil antes de postularte</p><p className="mt-2 text-sm leading-6">Para postularte necesitás el perfil activo, disponible, con consentimiento vigente y CV válido.</p><Link href={profileHref} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold underline underline-offset-4">Revisar perfil<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    </div>}
    {oferta && !selectedOffer && <p role="status" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5 leading-7 text-amber-950">La oferta elegida ya no está disponible para postularse.</p>}
    {selectedOffer && <section aria-label="Oferta elegida" className="mb-6 rounded-xl border-2 border-primary bg-surface p-6 sm:p-8">
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700"><BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />Tu oferta seleccionada</p>
      <h2 className="break-words text-xl font-bold text-primary-900">Oferta elegida: {selectedOffer.title}</h2>
      <OfferSummary offer={selectedOffer} />
      {workspace.profile && <div className={`${styles.forms} ${styles.apply} mt-5 max-w-md`}><CandidateApplyForm key={attemptKey(selectedOffer.id)} openingId={selectedOffer.id} candidateVersion={workspace.profile.version}
        generalCvName={workspace.cv?.original_name_safe} disabled={!enabled} participationsHref={participationsHref(selectedOffer.slug)} alreadyApplied={joinedOfferIds.has(selectedOffer.id)} /></div>}
    </section>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-primary-900">Ofertas vigentes</h2><p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Revisadas por la Oficina</p></div>
    {offers.items.length === 0 ? <Card className="p-8 text-center sm:p-12"><BriefcaseBusiness className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /><h3 className="mt-4 text-xl font-bold text-primary-900">No hay ofertas vigentes en esta página.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Podés volver a consultar más adelante y mantener tu perfil actualizado.</p><Link href={profileHref} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-secondary">Ir a mi perfil<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card> :
      <ul className={`${layoutStyles.desktopCards} ${cardLayout.grid} grid gap-5 md:grid-cols-2`}>{offers.items.filter((offer) => offer.id !== selectedOffer?.id).map((offer) => <li key={offer.id} className="min-w-0">
        <Card className={`${cardLayout.card} p-6`}>
          <div data-card-part="header" className={cardLayout.header}><h3 className="break-words text-xl font-bold leading-7"><Link href={`/ofertas/${offer.slug}`} className="rounded-sm text-primary-900 underline decoration-border underline-offset-4 hover:decoration-primary">{offer.title}</Link></h3></div>
          <div data-card-part="content" className={cardLayout.content}><OfferSummary offer={offer} /></div>
          <div data-card-part="footer" className={cardLayout.footer}>
            {workspace.profile && <div className={`${styles.forms} ${styles.apply}`}><CandidateApplyForm key={attemptKey(offer.id)} openingId={offer.id} candidateVersion={workspace.profile.version}
              generalCvName={workspace.cv?.original_name_safe} disabled={!enabled} participationsHref={participationsHref(offer.slug)} alreadyApplied={joinedOfferIds.has(offer.id)} /></div>}
          </div>
        </Card>
      </li>)}</ul>}
    <Pagination aria-label="Páginas de ofertas" className="mt-6">
      <PaginationContent>
        {offers.page > 1 && <PaginationItem><PaginationPrevious href={pageHref(offers.page - 1)} /></PaginationItem>}
        <PaginationItem><span className="px-3 text-sm text-muted-foreground">Página {offers.page}</span></PaginationItem>
        {offers.page * offers.pageSize < offers.total && <PaginationItem><PaginationNext href={pageHref(offers.page + 1)} /></PaginationItem>}
      </PaginationContent>
    </Pagination>
  </>;
}
