import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CalendarDays, ChevronLeft, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { Badge, Card, CardContent, CardHeader } from "@/components/ui";
import { listPublicOffers } from "@/features/openings/public-service";

export const dynamic = "force-dynamic";

export default async function PublicOffersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const result = await listPublicOffers({ page: page ?? 1 });
  const hasPrevious = result.page > 1;
  const hasNext = result.page * result.pageSize < result.total;

  return (
    <main id="contenido" tabIndex={-1} className="min-h-screen bg-page text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700">
            <Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 rounded-lg border border-border bg-surface" />
            <span className="hidden leading-tight sm:block">Municipalidad de Funes<span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span></span>
          </Link>
          <nav aria-label="Accesos principales">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary" href="/login">Iniciar sesión</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border bg-gradient-to-br from-primary-50 via-secondary to-page" aria-labelledby="ofertas-title">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pb-12">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary-700">Portal Municipal de Empleo</p>
          <h1 id="ofertas-title" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">Ofertas laborales vigentes</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Explorá las búsquedas y encontrá tu próxima oportunidad laboral. Solo se muestran ofertas aprobadas y dentro de su fecha de cierre.</p>
          <div className="mt-6 flex items-start gap-2 text-sm font-medium leading-6 text-primary-700">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>La Oficina de Empleo revisa las postulaciones y decide qué perfiles derivar a cada empresa.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section className="min-w-0" aria-labelledby="listado-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="listado-title" className="text-lg font-bold text-primary-900">{result.total} oferta{result.total === 1 ? "" : "s"} disponible{result.total === 1 ? "" : "s"}</h2>
            {result.items.length > 0 && <p className="text-sm text-muted-foreground">Mostrando {(result.page - 1) * result.pageSize + 1}–{Math.min(result.page * result.pageSize, result.total)} de {result.total}</p>}
          </div>
          {result.items.length === 0 ? (
            <Card className="border-dashed px-6 py-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true"><BriefcaseBusiness className="h-7 w-7" /></span>
              <h3 className="mt-5 text-xl font-bold text-primary-900">No hay ofertas vigentes en esta página.</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{result.total === 0 ? "Las nuevas búsquedas aparecerán acá una vez aprobadas por la Oficina de Empleo. Podés volver a consultar más adelante." : "Podés volver a la primera página para consultar las búsquedas disponibles."}</p>
              {result.total > 0 && <Link href="/ofertas" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-700">Ver ofertas disponibles<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </Card>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {result.items.map((offer) => (
                <li key={offer.id} className="min-w-0">
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-elevated focus-within:shadow-elevated">
                    <CardHeader>
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary" aria-hidden="true"><BriefcaseBusiness className="h-5 w-5" /></span>
                        <span className="text-xs font-semibold text-primary-700">Búsqueda vigente</span>
                      </div>
                      <h3 className="text-xl font-bold leading-snug text-primary-900">
                        <Link href={`/ofertas/${offer.id}`} className="group flex min-h-11 items-start justify-between gap-3 rounded-sm break-words hover:underline hover:underline-offset-4">
                          <span className="min-w-0">{offer.title}</span>
                          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                      </h3>
                      <p className="flex items-start gap-2 pt-2 text-sm font-semibold text-foreground"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="min-w-0 break-words">{offer.company_name}</span></p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{offer.location} · {offer.modality}</span></p>
                      <div className="flex flex-wrap gap-2" aria-label="Categorías laborales">
                        {offer.categories.length > 0 ? offer.categories.map((category) => <Badge key={category.id} variant="secondary" className="max-w-full leading-5"><span className="min-w-0 break-words">{category.name}</span></Badge>) : <Badge variant="outline" className="leading-5">Sin categorías</Badge>}
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4 text-xs leading-5">
                        <p className="font-semibold text-primary-700">{offer.vacancies} vacante{offer.vacancies === 1 ? "" : "s"}</p>
                        <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Cierre: <time dateTime={offer.closing_date}>{offer.closing_date}</time></span></p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          {(hasPrevious || hasNext) && (
            <nav aria-label="Páginas de ofertas" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              {hasPrevious ? <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary" href={`/ofertas?page=${result.page - 1}`} rel="prev"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Anterior</Link> : <span className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm text-muted-foreground" aria-disabled="true"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Anterior</span>}
              <p className="text-sm font-medium text-muted-foreground">Página {result.page}</p>
              {hasNext ? <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary" href={`/ofertas?page=${result.page + 1}`} rel="next">Siguiente<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link> : <span className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm text-muted-foreground" aria-disabled="true">Siguiente<ChevronRight className="h-4 w-4" aria-hidden="true" /></span>}
            </nav>
          )}
        </section>

        <aside aria-labelledby="acompanamiento-title" className="min-w-0 space-y-4 lg:pt-12">
          <Card className="border-primary-100 bg-primary-50 p-6">
            <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
            <h2 id="acompanamiento-title" className="mt-4 text-xl font-bold text-primary-900">Te acompañamos en la búsqueda</h2>
            <p className="mt-3 text-sm leading-6 text-foreground">Para postularte necesitás una cuenta de candidato y tu perfil completo con CV.</p>
            <Link href="/registro/candidato" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-700">Crear cuenta<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <p className="mt-4 text-sm leading-6 text-foreground">¿Ya tenés cuenta? <Link href="/login" className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Iniciá sesión</Link></p>
          </Card>
          <div className="rounded-xl border border-border px-6 py-5">
            <h3 className="text-sm font-bold text-primary-900">¿Necesitás ayuda con tu perfil?</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">La Oficina de Empleo también puede ayudarte de manera presencial a completar tus datos.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
