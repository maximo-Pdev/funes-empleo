import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, MapPin, ShieldCheck, UserRound, Users } from "lucide-react";
import { Badge, Card, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import { listPublicOffers, listPublicOfferFilters } from "@/features/openings/public-service";
import { PublicOfferSearchForm } from "@/features/openings/components/public-offer-search-form";
import { hasPublicOfferFilters, publicOffersPageHref } from "@/features/openings/public-search";
import { publicOfferSearchSchema } from "@/validation/public-offer-search";
import { getSiteAccess } from "@/features/accounts/navigation";
import { getRegistrationHref } from "@/features/accounts/registration-navigation";
import { formatPublicClosingDate, publicModalityLabel } from "@/features/openings/public-offer-display";
import { HomeNavbar } from "../home-navbar";

export const dynamic = "force-dynamic";

export default async function PublicOffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const input = publicOfferSearchSchema.safeParse({ ...await searchParams, pageSize: 10 });
  const filters = input.success ? input.data : publicOfferSearchSchema.parse({});
  const [result, { account: accountAccess, panel }, options] = await Promise.all([
    input.success ? listPublicOffers(filters) : Promise.resolve({ total: 0, page: 1, pageSize: 10, items: [] }),
    getSiteAccess(), listPublicOfferFilters(),
  ]);
  const filtered = hasPublicOfferFilters(filters);
  const hasPrevious = result.page > 1;
  const hasNext = result.page * result.pageSize < result.total;
  const authenticated = accountAccess.label !== "Iniciar sesión";

  return (
    <>
      <HomeNavbar alwaysVisible panel={authenticated ? accountAccess : null} />
      <main id="contenido" tabIndex={-1} className="min-h-screen bg-page pt-16 text-foreground">
        <header className="bg-brand-primary text-brand-secondary">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-start justify-between gap-x-10 gap-y-8 px-5 pb-12 pt-10 sm:px-10 lg:px-20 lg:pb-14 lg:pt-12">
            <div className="min-w-0 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-100">Portal Municipal de Empleo</p>
              <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                Ofertas laborales vigentes
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
                Explorá las búsquedas y encontrá tu próxima oportunidad laboral. Solo se muestran ofertas aprobadas y dentro de su fecha de cierre.
              </p>
              <p className="mt-6 flex max-w-2xl items-start gap-3 text-sm font-semibold leading-6 text-white">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                La Oficina de Empleo revisa las postulaciones y decide qué perfiles derivar a cada empresa.
              </p>
            </div>
            <nav aria-label="Accesos principales" className="shrink-0">
              <Link
                href={accountAccess.href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/45 px-5 py-2 font-heading text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-brand-primary"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {accountAccess.label}
              </Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-8 sm:px-10 lg:px-20 lg:pb-20 lg:pt-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
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
                    <Link
                      href={filtered ? publicOffersPageHref(filters, 1) : "/ofertas"}
                      className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 font-heading text-sm font-semibold text-white transition-colors hover:bg-brand-text"
                    >
                      Ver ofertas disponibles
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </Card>
              ) : (
                <ul className="grid gap-5 md:grid-cols-2">
                  {result.items.map((offer) => (
                    <li key={offer.id} className="min-w-0">
                      <article className="flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated focus-within:shadow-elevated sm:p-6">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
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
                          <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-primary">
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 break-words">{offer.company_name}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2" aria-label="Categorías laborales">
                          {offer.categories.length > 0 ? offer.categories.map((category) => (
                            <Badge key={category.id} variant="outline" className="max-w-full leading-5">
                              <span className="min-w-0 break-words">{category.name}</span>
                            </Badge>
                          )) : <Badge variant="outline" className="leading-5">Sin categorías</Badge>}
                        </div>

                        <div className="mt-auto grid gap-2 border-t border-border pt-4 text-sm leading-6">
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
                  <PaginationContent className="w-full justify-between">
                    {hasPrevious && <PaginationItem><PaginationPrevious href={publicOffersPageHref(filters, result.page - 1)} rel="prev" /></PaginationItem>}
                    <PaginationItem><span className="text-sm font-medium text-muted-foreground">Página {result.page}</span></PaginationItem>
                    {hasNext && <PaginationItem><PaginationNext href={publicOffersPageHref(filters, result.page + 1)} rel="next" /></PaginationItem>}
                  </PaginationContent>
                </Pagination>
              )}
            </section>

            <aside aria-labelledby="acompanamiento-title" className="min-w-0 space-y-5 lg:sticky lg:top-24">
              <Card className="overflow-hidden">
                <div className="border-b border-border bg-primary-50 px-6 py-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-700">Con acompañamiento municipal</p>
                  <h2 id="acompanamiento-title" className="mt-3 font-heading text-xl font-bold leading-snug text-primary-900">
                    Te acompañamos en la búsqueda
                  </h2>
                  <p className="mt-3 text-sm leading-6">{panel ? "Ya tenés una sesión iniciada. Continuá con tus gestiones desde tu panel." : "Para postularte necesitás una cuenta de candidato y tu perfil completo con CV."}</p>
                  {panel ? (
                    <Link
                      href={panel.href}
                      className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 font-heading text-sm font-semibold text-white transition-colors hover:bg-brand-text"
                    >
                      Ir al {panel.label.toLowerCase()}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={getRegistrationHref("candidate")}
                        className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 font-heading text-sm font-semibold text-white transition-colors hover:bg-brand-text"
                      >
                        Crear cuenta
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <p className="mt-4 text-sm leading-6">
                        ¿Ya tenés cuenta? <Link href="/" className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 hover:text-brand-text">Iniciá sesión</Link>
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-start gap-3 px-6 py-5">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm leading-6 text-muted-foreground">Tu información se comparte con la empresa únicamente después de una derivación de la Oficina.</p>
                </div>
              </Card>
              <div className="rounded-xl border border-border bg-surface px-6 py-5 shadow-card">
                <h3 className="font-heading text-base font-bold text-primary-900">¿Necesitás ayuda con tu perfil?</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">La Oficina de Empleo también puede ayudarte de manera presencial a completar tus datos.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
