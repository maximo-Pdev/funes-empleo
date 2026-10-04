import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { listPublicOffers } from "@/features/openings/public-service";
import type { PublicOffer } from "@/features/openings/public-service";

export const dynamic = "force-dynamic";

type FeaturedOffersState =
  | { status: "ready"; items: PublicOffer[] }
  | { status: "unavailable"; items: [] };

async function getFeaturedOffers(): Promise<FeaturedOffersState> {
  try {
    const offers = await listPublicOffers({ page: 1, pageSize: 3 });
    return { status: "ready", items: offers.items };
  } catch {
    return { status: "unavailable", items: [] };
  }
}

const roleCards = [
  {
    icon: Users,
    title: "Postulantes",
    description: "Completá tu perfil, cargá tu CV y postulá a búsquedas aprobadas por la Oficina de Empleo.",
    href: "/registro/candidato",
    linkLabel: "Crear cuenta de postulante",
  },
  {
    icon: Building2,
    title: "Empresas",
    description: "Registrá tu empresa, prepará ofertas y recibí perfiles solo cuando exista una derivación municipal.",
    href: "/registro/empresa",
    linkLabel: "Registrar empresa",
  },
  {
    icon: ShieldCheck,
    title: "Municipalidad",
    description: "Gestioná candidatos, moderá ofertas, derivá perfiles y registrá resultados con trazabilidad.",
    href: "/login",
    linkLabel: "Ingresar al panel",
  },
];

const processSteps = [
  "La empresa envía una búsqueda para revisión municipal.",
  "La Oficina publica la oferta y evalúa postulantes.",
  "Solo los perfiles derivados se comparten con la empresa.",
];

export default async function HomePage() {
  const featuredOffers = await getFeaturedOffers();

  return (
    <main id="contenido" className="min-h-screen overflow-hidden bg-page text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold text-primary-700">
            <Image
              src="/brand/logo-funes-gris.svg"
              alt="Municipalidad de Funes"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-lg border border-border bg-surface"
            />
            <span className="hidden leading-tight sm:block">
              Municipalidad de Funes
              <span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span>
            </span>
          </Link>
          <nav aria-label="Accesos principales" className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold">
            <Link className="rounded-lg px-3 py-2 text-primary hover:bg-secondary" href="/ofertas">
              Ofertas
            </Link>
            <Link className="rounded-lg border border-border bg-surface px-3 py-2 text-primary hover:bg-secondary" href="/login">
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative border-b border-border bg-[linear-gradient(135deg,#f5f8f6_0%,#e3f2e9_52%,#f5f8f6_100%)]">
        <div className="absolute -right-28 top-8 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-primary-100 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Oficina de Empleo · Municipalidad de Funes
            </Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
              Un puente claro entre personas que buscan trabajo y empresas de Funes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              El portal organiza perfiles, ofertas y derivaciones sin convertir el proceso en un mercado abierto: la Oficina de Empleo revisa, acompaña y decide cada paso sensible.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground shadow-elevated transition hover:bg-primary-700" href="/registro/candidato">
                Registrarme como postulante
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-bold text-primary transition hover:bg-secondary" href="/registro/empresa">
                Registrar empresa
              </Link>
            </div>
          </div>

          <Card className="relative overflow-hidden shadow-elevated">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-primary-100" aria-hidden="true" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-4">
                <Image
                  src="/brand/logo-funes-verde.svg"
                  alt="Escudo de la Municipalidad de Funes"
                  width={76}
                  height={76}
                  className="h-16 w-16 rounded-xl bg-primary"
                />
                <Badge variant="outline">Demo con datos ficticios</Badge>
              </div>
              <CardTitle className="pt-4 text-2xl text-primary-900">Intermediación municipal protegida</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-muted-foreground">
                Las empresas no ven el padrón completo. Los perfiles se comparten únicamente después de una derivación autorizada a una oferta propia.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Perfiles", "500"],
                  ["Empresas", "50"],
                  ["Ofertas", "100"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-secondary p-4">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-primary-700">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12" aria-labelledby="search-title">
        <Card className="grid gap-5 p-5 shadow-card md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true">
              <Search className="h-6 w-6" />
            </span>
            <div>
              <h2 id="search-title" className="text-2xl font-bold text-primary-900">Buscá ofertas laborales vigentes</h2>
              <p className="mt-2 text-muted-foreground">Todas las búsquedas visibles fueron aprobadas por la Municipalidad y están dentro de su fecha de cierre.</p>
            </div>
          </div>
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground hover:bg-primary-700" href="/ofertas">
            Ver ofertas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <section className="bg-surface py-14" aria-labelledby="ofertas-title">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-500">Ofertas recientes</p>
              <h2 id="ofertas-title" className="mt-2 text-3xl font-bold text-primary-900">Búsquedas aprobadas por la Oficina de Empleo</h2>
            </div>
            <Link className="inline-flex items-center gap-2 font-bold text-primary underline decoration-primary-400 decoration-2 underline-offset-4" href="/ofertas">
              Ver todas
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {featuredOffers.status === "unavailable" ? (
            <Card className="mt-8 border-dashed p-8">
              <CardTitle className="text-primary-900">No pudimos cargar las ofertas en este momento.</CardTitle>
              <p className="mt-2 text-muted-foreground">Podés entrar al listado completo o volver a intentarlo más tarde.</p>
            </Card>
          ) : featuredOffers.items.length === 0 ? (
            <Card className="mt-8 border-dashed p-8">
              <CardTitle className="text-primary-900">No hay ofertas vigentes para mostrar.</CardTitle>
              <p className="mt-2 text-muted-foreground">Cuando una empresa publique una búsqueda aprobada, va a aparecer en esta sección.</p>
            </Card>
          ) : (
            <ul className="mt-8 grid gap-5 lg:grid-cols-3">
              {featuredOffers.items.map((offer) => (
                <li key={offer.id}>
                  <Card className="h-full transition hover:-translate-y-1 hover:shadow-elevated">
                    <CardHeader>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {offer.categories.slice(0, 2).map((category) => (
                          <Badge key={category.id} variant="secondary">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle>
                        <Link className="hover:underline" href={`/ofertas/${offer.id}`}>
                          {offer.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="font-semibold text-primary-700">{offer.company_name}</p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {offer.location} · {offer.modality}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                        {offer.vacancies} vacante{offer.vacancies === 1 ? "" : "s"} · Cierre: {offer.closing_date}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14" aria-labelledby="roles-title">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-500">Accesos por rol</p>
          <h2 id="roles-title" className="mt-2 text-3xl font-bold text-primary-900">Cada perfil entra por el camino correcto</h2>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-primary-900">{card.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{card.description}</p>
                <Link className="mt-5 inline-flex items-center gap-2 font-bold text-primary underline decoration-primary-400 decoration-2 underline-offset-4" href={card.href}>
                  {card.linkLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/70 py-14" aria-labelledby="process-title">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-500">Cómo funciona</p>
              <h2 id="process-title" className="mt-2 text-3xl font-bold text-primary-900">Simple para usar, cuidadoso con los datos.</h2>
            </div>
            <ol className="grid gap-4">
              {processSteps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-xl bg-surface p-5 shadow-card">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="leading-7 text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <footer className="bg-primary-900 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" aria-hidden="true" />
            <p className="font-semibold">Portal Municipal de Empleo de Funes</p>
          </div>
          <p className="text-sm text-white/75">Entorno de demostración con datos ficticios.</p>
        </div>
      </footer>
    </main>
  );
}
