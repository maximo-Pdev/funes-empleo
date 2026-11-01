import Link from "next/link";
import { CategoryLabel } from "@/components/job-category-label";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  FileText,
  Gift,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { LinkButton } from "@/components/ui/link-button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { HomeNavbar } from "@/app/(public)/home-navbar";
import accountStyles from "@/app/(auth)/account/account.module.css";
import { getPublicOffer } from "@/features/openings/public-service";
import { getSiteAccess } from "@/features/accounts/navigation";
import { formatPublicClosingDate, publicContractTypeLabel, publicModalityLabel } from "@/features/openings/public-offer-display";
import { AppError } from "@/lib/errors/public-error";

export const dynamic = "force-dynamic";

export default async function PublicOfferDetailPage({ params }: { params: Promise<{ openingId: string }> }) {
  const { openingId: slug } = await params;
  let offer, access;
  try { [offer, access] = await Promise.all([getPublicOffer(slug), getSiteAccess()]); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }

  const conditions = [
    { label: "Ubicación", value: offer.location, icon: MapPin },
    { label: "Modalidad", value: publicModalityLabel(offer.modality), icon: BriefcaseBusiness },
    { label: "Horario", value: offer.schedule, icon: Clock3 },
    { label: "Contratación", value: publicContractTypeLabel(offer.contract_type), icon: FileText },
    { label: "Vacantes", value: offer.vacancies, icon: Users },
    { label: "Fecha de cierre", value: <time dateTime={offer.closing_date}>{formatPublicClosingDate(offer.closing_date)}</time>, icon: CalendarDays },
  ];

  return (
    <>
      <HomeNavbar alwaysVisible panel={access.panel} />
      <main id="contenido" tabIndex={-1} className="min-h-screen bg-brand-primary px-4 pb-8 pt-24 text-foreground sm:px-6">
        <div className={accountStyles.candidateCanvas} data-slot="public-offer-canvas">
          <div className={accountStyles.sectionContent}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><Link href="/" className="inline-flex min-h-11 items-center hover:text-primary hover:underline">Inicio</Link></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><Link href="/ofertas" className="inline-flex min-h-11 items-center hover:text-primary hover:underline">Ofertas</Link></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage className="min-w-0 break-words">{offer.title}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

      <section aria-labelledby="oferta-title" className="border-b border-border pb-8">
          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-surface text-primary" aria-hidden="true">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <Badge variant="secondary" className="gap-2 leading-5">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Oferta aprobada por la Oficina de Empleo
            </Badge>
          </div>
          <h1 id="oferta-title" className="mt-5 max-w-4xl break-words font-heading text-3xl font-semibold leading-tight tracking-tight text-primary-900 sm:text-4xl">
            {offer.title}
          </h1>
          <p className="mt-4 flex max-w-3xl items-start gap-2 text-base font-semibold leading-7 text-primary-700 sm:text-lg">
            <Building2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{offer.company_name}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Categorías laborales">
            {offer.categories.length > 0 ? offer.categories.map((category) => (
              <Badge key={category.id} variant="outline" className="max-w-full leading-5">
                <CategoryLabel name={category.name} />
              </Badge>
            )) : <Badge variant="outline" className="leading-5">Sin categorías</Badge>}
          </div>
      </section>

      <div className="py-8">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="condiciones-title">
            <Card className="rounded-none border-0 shadow-none">
              <h2 id="condiciones-title" className="font-heading text-xl font-semibold text-primary-900">La oferta en un vistazo</h2>
              <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                {conditions.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="min-w-0">
                    <dt className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      {label}
                    </dt>
                    <dd className="ml-8 mt-1 break-words text-sm font-semibold leading-6">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </section>

          <Card className="divide-y divide-border rounded-none border-0 shadow-none">
            <section aria-labelledby="tareas-title" className="py-6">
              <h2 id="tareas-title" className="flex items-center gap-3 font-heading text-xl font-semibold text-primary-900">
                <ClipboardList className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                Tareas
              </h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7">{offer.tasks}</p>
            </section>
            <section aria-labelledby="requisitos-title" className="py-6">
              <h2 id="requisitos-title" className="flex items-center gap-3 font-heading text-xl font-semibold text-primary-900">
                <CheckCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                Requisitos
              </h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7">{offer.requirements}</p>
            </section>
          </Card>

          {(offer.salary || offer.benefits) && (
            <Card className="divide-y divide-border rounded-none border-0 shadow-none">
              {offer.salary && (
                <section aria-labelledby="salario-title" className="py-6">
                  <h2 id="salario-title" className="flex items-center gap-3 font-heading text-xl font-semibold text-primary-900">
                    <Wallet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    Salario
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-7">{offer.salary}</p>
                </section>
              )}
              {offer.benefits && (
                <section aria-labelledby="beneficios-title" className="py-6">
                  <h2 id="beneficios-title" className="flex items-center gap-3 font-heading text-xl font-semibold text-primary-900">
                    <Gift className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    Beneficios
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-7">{offer.benefits}</p>
                </section>
              )}
            </Card>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <LinkButton href={`/dashboard?section=ofertas&oferta=${offer.slug}`} className="gap-2">
            Postularme con mi cuenta
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </LinkButton>
        </div>
      </div>
          </div>
        </div>
      </main>
    </>
  );
}
