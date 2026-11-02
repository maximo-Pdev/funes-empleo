import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, MapPin, ShieldCheck, Users } from "lucide-react";
import { Badge, Card, Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui";
import { listPublicOffers, listPublicOfferFilters } from "@/features/openings/public-service";
import { PublicOfferSearchForm } from "@/features/openings/components/public-offer-search-form";
import { hasPublicOfferFilters, publicOffersPageHref } from "@/features/openings/public-search";
import { publicOfferSearchSchema } from "@/validation/public-offer-search";
import { getSiteAccess } from "@/features/accounts/navigation";
import { CategoryLabel } from "@/components/job-category-label";
import { formatPublicClosingDate, publicModalityLabel } from "@/features/openings/public-offer-display";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";
import { PublicOffersShell } from "./public-offers-shell";
import styles from "./public-offers.module.css";
import cardLayout from "@/components/ui/card-layout.module.css";

export const dynamic = "force-dynamic";

export default async function PublicOffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const input = publicOfferSearchSchema.safeParse({ ...await searchParams, pageSize: 10 });
  const filters = input.success ? input.data : publicOfferSearchSchema.parse({});
  const [result, { panel }, options] = await Promise.all([
    input.success ? listPublicOffers(filters) : Promise.resolve({ total: 0, page: 1, pageSize: 10, items: [] }),
    getSiteAccess(), listPublicOfferFilters(),
  ]);
  const filtered = hasPublicOfferFilters(filters);
  const hasPrevious = result.page > 1;
  const hasNext = result.page * result.pageSize < result.total;
  const pageCount = Math.ceil(result.total / result.pageSize);

  return (
    <PublicOffersShell panel={panel}>
        <section aria-labelledby="public-offers-title" className={styles.heading}>
              <p className={styles.eyebrow}>Portal Municipal de Empleo</p>
              <h1 id="public-offers-title">
                Ofertas laborales vigentes
              </h1>
              <p className={styles.introduction}>
                Explorá las búsquedas y encontrá tu próxima oportunidad laboral. Solo se muestran ofertas aprobadas y dentro de su fecha de cierre.
              </p>
              <p className={styles.notice}>
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                La Oficina de Empleo revisa las postulaciones y decide qué perfiles derivar a cada empresa.
              </p>
        </section>

          <div className={styles.contentGrid}>
            <section className="min-w-0" aria-labelledby="listado-title">
              <PublicOfferSearchForm filters={filters} options={options} />
              {!input.success && (
                <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800">
                  Revisá los filtros de búsqueda: usá un solo valor por campo y una página válida.
                </p>
              )}

              <div className="mb-5 mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <h2 id="listado-title" className="font-heading text-xl font-bold tracking-tight text-primary-900 sm:text-2xl">
                  {input.success ? `${result.total} oferta${result.total === 1 ? "" : "s"} disponible${result.total === 1 ? "" : "s"}` : "Revisá los filtros para buscar"}
                </h2>
                {result.items.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(result.page - 1) * result.pageSize + 1}–{Math.min(result.page * result.pageSize, result.total)} de {result.total}
                  </p>
                )}
              </div>

              {result.items.length === 0 ? (
                <Card className="border-dashed px-6 py-14 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary" aria-hidden="true">
                    <BriefcaseBusiness className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-bold text-primary-900">
                    {!input.success ? "No se pudo realizar la búsqueda." : filtered && result.total === 0 ? "No encontramos ofertas con esos filtros." : "No hay ofertas vigentes en esta página."}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    {!input.success || filtered && result.total === 0
                      ? "Podés corregir o limpiar los filtros para volver a buscar."
                      : result.total === 0
                        ? "Las nuevas búsquedas aparecerán acá una vez aprobadas por la Oficina de Empleo. Podés volver a consultar más adelante."
                        : "Podés volver a la primera página para consultar las búsquedas disponibles."}
                  </p>
                  {result.total > 0 && (
                    <LinkButton
                      href={filtered ? publicOffersPageHref(filters, 1) : "/ofertas"}
                      className="mt-6 gap-2"
                    >
                      Ver ofertas disponibles
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </LinkButton>
                  )}
                </Card>
              ) : (
                <ul className={cn(styles.offerGrid, cardLayout.grid, "grid gap-5 md:grid-cols-2")}>
                  {result.items.map((offer) => (
                    <li key={offer.id} className="min-w-0">
                      <article className={cn(styles.offerCard, cardLayout.card)}>
                        <div data-card-part="header" className={cardLayout.header}>
                          <div className="flex w-full flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-700">
                              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                              Búsqueda vigente
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <Users className="h-4 w-4" aria-hidden="true" />
                              {offer.vacancies} vacante{offer.vacancies === 1 ? "" : "s"}
                            </span>
                          </div>
                          <h3 className="mt-3 break-words font-heading text-lg font-bold leading-snug text-brand-text">
                            <Link href={`/ofertas/${offer.slug}`} className="group inline-flex items-start justify-between gap-2 rounded-sm hover:underline hover:underline-offset-4">
                              <span className="min-w-0">{offer.title}</span>
                              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                          </h3>
                          <p className={cn(styles.companyName, "flex items-start gap-2 text-sm font-semibold text-primary")}>
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 break-words">{offer.company_name}</span>
                          </p>
                        </div>

                        <div data-card-part="content" className="flex flex-wrap items-start gap-2" aria-label="Categorías laborales">
                          {offer.categories.length > 0 ? offer.categories.map((category) => (
                            <Badge key={category.id} variant="outline" className="max-w-full leading-5">
                              <CategoryLabel name={category.name} />
                            </Badge>
                          )) : <Badge variant="outline" className="leading-5">Sin categorías</Badge>}
                        </div>

                        <div data-card-part="footer" className={cn(cardLayout.footer, "gap-2 border-t border-border pt-4 text-sm leading-6")}>
                          <p className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span className="min-w-0 break-words">{offer.location} · {publicModalityLabel(offer.modality)}</span>
                          </p>
                          <p className="flex items-start gap-2 text-muted-foreground">
                            <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span>Cierre: <time className="font-semibold text-foreground" dateTime={offer.closing_date}>{formatPublicClosingDate(offer.closing_date)}</time></span>
                          </p>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}

              {(hasPrevious || hasNext) && (
                <Pagination aria-label="Páginas de ofertas" className="mt-8 border-t border-border pt-6">
                  <PaginationContent className="flex-wrap justify-center">
                    {hasPrevious && <PaginationItem><PaginationPrevious href={publicOffersPageHref(filters, result.page - 1)} rel="prev" /></PaginationItem>}
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink href={publicOffersPageHref(filters, page)} aria-label={`Página ${page}`} isActive={page === result.page}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {hasNext && <PaginationItem><PaginationNext href={publicOffersPageHref(filters, result.page + 1)} rel="next" /></PaginationItem>}
                  </PaginationContent>
                </Pagination>
              )}
            </section>
          </div>
    </PublicOffersShell>
  );
}
