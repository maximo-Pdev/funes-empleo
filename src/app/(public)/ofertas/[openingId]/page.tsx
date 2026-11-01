import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegistrationHref } from "@/features/accounts/registration-navigation";
import {
  ArrowLeft,
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
import { getPublicOffer } from "@/features/openings/public-service";
import { getPanelHref, getSiteAccess } from "@/features/accounts/navigation";
import { formatPublicClosingDate, publicContractTypeLabel, publicModalityLabel } from "@/features/openings/public-offer-display";
import { AppError } from "@/lib/errors/public-error";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";
import { PublicOffersShell } from "../public-offers-shell";
import styles from "../public-offers.module.css";

export const dynamic = "force-dynamic";

export default async function PublicOfferDetailPage({ params }: { params: Promise<{ openingId: string }> }) {
  const { openingId: slug } = await params;
  let offer, access;
  try { [offer, access] = await Promise.all([getPublicOffer(slug), getSiteAccess()]); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  const { panel } = access;
  const candidateAccess = !panel || panel.href === getPanelHref("candidate");
  const primaryAction = panel && !candidateAccess
    ? { href: panel.href, label: `Ir al ${panel.label.toLowerCase()}` }
    : { href: `/dashboard?section=ofertas&oferta=${offer.slug}`, label: "Postularme con mi cuenta" };

  const conditions = [
    { label: "Ubicación", value: offer.location, icon: MapPin },
    { label: "Modalidad", value: publicModalityLabel(offer.modality), icon: BriefcaseBusiness },
    { label: "Horario", value: offer.schedule, icon: Clock3 },
    { label: "Contratación", value: publicContractTypeLabel(offer.contract_type), icon: FileText },
    { label: "Vacantes", value: offer.vacancies, icon: Users },
    { label: "Fecha de cierre", value: <time dateTime={offer.closing_date}>{formatPublicClosingDate(offer.closing_date)}</time>, icon: CalendarDays },
  ];

  return (
    <PublicOffersShell panel={panel}>
      <section aria-labelledby="oferta-title" className={styles.heading}>
          <Link href="/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a ofertas
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-surface text-primary" aria-hidden="true">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <Badge variant="secondary" className="gap-2 leading-5">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Oferta aprobada por la Oficina de Empleo
            </Badge>
          </div>
          <h1 id="oferta-title">
            {offer.title}
          </h1>
          <p className="mt-4 flex max-w-3xl items-start gap-2 text-base font-semibold leading-7 text-primary-700 sm:text-lg">
            <Building2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{offer.company_name}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Categorías laborales">
            {offer.categories.length > 0 ? offer.categories.map((category) => (
              <Badge key={category.id} variant="outline" className="max-w-full leading-5">
                <span className="min-w-0 break-words">{category.name}</span>
              </Badge>
            )) : <Badge variant="outline" className="leading-5">Sin categorías</Badge>}
          </div>
      </section>

      <div className={styles.contentGrid}>
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="condiciones-title">
            <Card className={cn(styles.card, "p-5 sm:p-7")}>
              <h2 id="condiciones-title" className="text-xl font-bold text-primary-900">La oferta en un vistazo</h2>
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

          <Card className={cn(styles.card, "divide-y divide-border")}>
            <section aria-labelledby="tareas-title" className="p-5 sm:p-7">
              <h2 id="tareas-title" className="flex items-center gap-3 text-xl font-bold text-primary-900">
                <ClipboardList className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                Tareas
              </h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7">{offer.tasks}</p>
            </section>
            <section aria-labelledby="requisitos-title" className="p-5 sm:p-7">
              <h2 id="requisitos-title" className="flex items-center gap-3 text-xl font-bold text-primary-900">
                <CheckCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                Requisitos
              </h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7">{offer.requirements}</p>
            </section>
          </Card>

          {(offer.salary || offer.benefits) && (
            <Card className={cn(styles.card, "divide-y divide-border")}>
              {offer.salary && (
                <section aria-labelledby="salario-title" className="p-5 sm:p-7">
                  <h2 id="salario-title" className="flex items-center gap-3 text-xl font-bold text-primary-900">
                    <Wallet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    Salario
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-7">{offer.salary}</p>
                </section>
              )}
              {offer.benefits && (
                <section aria-labelledby="beneficios-title" className="p-5 sm:p-7">
                  <h2 id="beneficios-title" className="flex items-center gap-3 text-xl font-bold text-primary-900">
                    <Gift className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    Beneficios
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-7">{offer.benefits}</p>
                </section>
              )}
            </Card>
          )}
        </div>

        <aside aria-labelledby="postulacion-title" className={cn(styles.aside, "space-y-5")}>
          <Card className={cn(styles.card, "overflow-hidden")}>
            <div className="border-b border-border bg-primary-50 px-5 py-6 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-700">Tu próxima oportunidad</p>
              <h2 id="postulacion-title" className="mt-3 text-2xl font-bold text-primary-900">¿Te interesa esta oferta?</h2>
              <p className="mt-3 text-sm leading-6">{candidateAccess ? "Revisá los requisitos y postulate desde tu cuenta de candidato." : "Ya tenés una sesión iniciada. Continuá con tus gestiones desde tu panel."}</p>
              <LinkButton
                href={primaryAction.href}
                className={styles.action}
              >
                {primaryAction.label}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </LinkButton>
              {!panel && <p className="mt-4 text-sm leading-6">¿Todavía no tenés cuenta? <Link href={getRegistrationHref("candidate")} className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Registrate</Link></p>}
            </div>
            <div className="flex items-start gap-3 px-5 py-5 sm:px-6">
              <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-6"><span className="block text-muted-foreground">Fecha de cierre</span><time className="font-semibold" dateTime={offer.closing_date}>{formatPublicClosingDate(offer.closing_date)}</time></p>
            </div>
          </Card>
          <div className="rounded-xl border border-border p-5 sm:p-6">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-3 text-base font-bold text-primary-900">Con acompañamiento municipal</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">La Oficina de Empleo evalúa las postulaciones y decide qué perfiles derivar. Tu información se comparte con la empresa únicamente después de esa derivación.</p>
          </div>
        </aside>
      </div>
    </PublicOffersShell>
  );
}
