import { formatCalendarDate, formatFunesDate } from "@/lib/time/presentation";
import Link from "next/link";
import { CategoryLabels } from "@/components/job-category-label";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ClipboardList, CircleCheck, CircleSlash, FileText, ShieldCheck, UserRound } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { candidateProfileStatusLabels } from "@/features/candidates/candidate-profile-status";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { candidateStatusLabels } from "@/features/participations/candidate-status-labels";
import { candidateProfileStatusTones, participationStatusTones, statusTone, type StatusTone } from "@/domain/presentation/status-tone";
import styles from "./account.module.css";
import { listSuggestedOffers } from "@/features/openings/recommendations-service";

const closedStatuses = ["hired", "not_selected", "withdrawn", "cancelled", "no_company_response"];

function receivedOn(value: string) {
  return formatFunesDate(value);
}

export async function renderCandidateDashboardContent({ workspace, profileHref, participationsHref, offersHref }: {
  workspace: Awaited<ReturnType<typeof getCandidateWorkspace>>;
  profileHref: string;
  participationsHref: string;
  offersHref: string;
}) {
  const items = await listMyParticipations();
  const open = items.filter((item) => !closedStatuses.includes(item.display_status));
  const closed = items.filter((item) => closedStatuses.includes(item.display_status));
  const profile = workspace.profile;
  const selectedIds = new Set(workspace.categories?.map(item => item.category_id) ?? []);
  const selectedCategories = workspace.allCategories?.filter(item => selectedIds.has(item.id)) ?? [];
  let suggestions: Awaited<ReturnType<typeof listSuggestedOffers>> = [];
  let suggestionsUnavailable = false;
  try {
    suggestions = await listSuggestedOffers(selectedCategories.map(item => item.code), items.map(item => item.opening_id));
  } catch { suggestionsUnavailable = true; }
  const selectedOfferHref = (slug: string) => {
    const [path, query] = offersHref.split("?");
    const params = new URLSearchParams(query);
    params.set("oferta", slug);
    return `${path}?${params}`;
  };
  const checks: Array<{ label: string; value: string; tone: StatusTone; done: boolean }> = [
    { label: "Perfil", value: profile ? candidateProfileStatusLabels[profile.status] ?? "Registrado" : "Sin perfil", tone: statusTone(candidateProfileStatusTones, profile?.status), done: profile?.status === "active" },
    { label: "Disponibilidad", value: profile?.availability === "available" ? "Disponible" : "No disponible", tone: profile?.availability === "available" ? "green" : "amber", done: profile?.availability === "available" },
    { label: "CV", value: workspace.cv ? "Cargado" : "Pendiente", tone: workspace.cv ? "green" : "amber", done: Boolean(workspace.cv) },
    { label: "Consentimiento", value: workspace.consent?.status === "accepted" ? "Vigente" : "Pendiente", tone: workspace.consent?.status === "accepted" ? "green" : "amber", done: workspace.consent?.status === "accepted" },
  ];

  return <>
    <section aria-labelledby="dashboard-resumen">
      <h2 id="dashboard-resumen" className={styles.sectionTitle}>Resumen</h2>
      <ul className={styles.metrics}>
        <li><Card className={styles.metric}><ClipboardList className={styles.metricIcon} aria-hidden="true" /><p className={styles.metricValue}>{items.length}</p><p className={styles.metricLabel}>{items.length === 1 ? "Postulación registrada" : "Postulaciones registradas"}</p></Card></li>
        <li><Card className={styles.metric}><CircleCheck className={styles.metricIcon} aria-hidden="true" /><p className={styles.metricValue}>{open.length}</p><p className={styles.metricLabel}>{open.length === 1 ? "Postulación en curso" : "Postulaciones en curso"}</p></Card></li>
        <li><Card className={styles.metric}><CircleSlash className={styles.metricIcon} aria-hidden="true" /><p className={styles.metricValue}>{closed.length}</p><p className={styles.metricLabel}>{closed.length === 1 ? "Postulación cerrada" : "Postulaciones cerradas"}</p></Card></li>
      </ul>
    </section>

    <section aria-labelledby="dashboard-perfil" className={styles.dashboardSection}>
      <div className={styles.sectionHead}>
        <h2 id="dashboard-perfil" className={styles.sectionTitle}>Estado de mi perfil</h2>
        <Link href={profileHref} className={styles.sectionLink}>Revisar perfil<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <Card className={styles.summary}>
        <ul className={styles.checks}>
          {checks.map((check) => <li key={check.label} className={styles.checkRow} data-done={check.done}>
            {check.done ? <CircleCheck className={styles.checkIcon} aria-hidden="true" /> : <CircleSlash className={styles.checkIcon} aria-hidden="true" />}
            <span className={styles.checkLabel}>{check.label}</span>
            <span className={styles.checkValue}><Badge variant="status" tone={check.tone}>{check.value}</Badge></span>
          </li>)}
        </ul>
        <p className={styles.summaryNote}><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />La Oficina de Empleo revisa los perfiles antes de derivarlos a una empresa.</p>
      </Card>
    </section>

    <section aria-labelledby="dashboard-sugerencias" className={styles.dashboardSection}>
      <div className={styles.sectionHead}><h2 id="dashboard-sugerencias" className={styles.sectionTitle}>Ofertas según tus rubros</h2>
        <Link href={offersHref} className={styles.sectionLink}>Ver todas las ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Una selección de ofertas vigentes que coinciden con al menos uno de tus rubros. No implica preselección ni garantiza una contratación.</p>
      {suggestionsUnavailable ? <p role="status">No pudimos cargar las sugerencias. Podés consultar todas las ofertas.</p>
        : selectedCategories.length === 0 ? <p>Seleccioná tus rubros en <Link href={profileHref} className={styles.sectionLink}>Mi perfil</Link> para recibir sugerencias.</p>
          : suggestions.length === 0 ? <p>No hay sugerencias nuevas entre las ofertas recientes de tus rubros. Podés explorar el catálogo completo.</p>
            : <ul className={styles.dashboardList}>{suggestions.map(offer => <li key={offer.id}><article className={styles.dashboardItem}>
              <h3 className={styles.itemTitle}><Link href={selectedOfferHref(offer.slug)} className={styles.sectionLink}>{offer.title}</Link></h3>
              <p className={styles.itemMeta}>{offer.company_name} · {offer.location}</p>
              <p className={styles.itemMeta}>Cierre: {formatCalendarDate(offer.closing_date)}</p>
              <p className="text-sm text-muted-foreground">Rubros: <CategoryLabels categories={offer.categories} /></p>
            </article></li>)}</ul>}
    </section>

    <section aria-labelledby="dashboard-curso" className={styles.dashboardSection}>
      <div className={styles.sectionHead}>
        <h2 id="dashboard-curso" className={styles.sectionTitle}>Postulaciones en curso</h2>
        <Link href={participationsHref} className={styles.sectionLink}>Ver todas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      {open.length === 0
        ? <Card className={styles.dashboardEmpty}><BriefcaseBusiness className="h-6 w-6 text-primary" aria-hidden="true" /><p className="mt-3 text-sm leading-6 text-muted-foreground">No tenés postulaciones en curso. Cuando te postules a una oferta, vas a verla acá con su estado.</p><Link href={offersHref} className={styles.emptyLink}>Explorar ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card>
        : <ul className={styles.dashboardList}>{open.map((item) => <li key={item.id}>
          <Card className={styles.dashboardItem}>
            <div className={styles.itemHead}><h3 className={styles.itemTitle}>{item.opening_title ?? "Oferta"}</h3><Badge variant="status" tone={statusTone(participationStatusTones, item.display_status)}><span className="min-w-0 break-words">{candidateStatusLabels[item.display_status] ?? "Resultado registrado"}</span></Badge></div>
            <p className={styles.itemMeta}><CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Recibida: {receivedOn(item.created_at)}</p>
          </Card>
        </li>)}</ul>}
    </section>

    {closed.length > 0 && <section aria-labelledby="dashboard-cerradas" className={styles.dashboardSection}>
      <div className={styles.sectionHead}>
        <h2 id="dashboard-cerradas" className={styles.sectionTitle}>Postulaciones cerradas</h2>
        <Link href={participationsHref} className={styles.sectionLink}>Ver todas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <ul className={styles.dashboardList}>{closed.map((item) => <li key={item.id}>
        <Card className={styles.dashboardItem}>
          <div className={styles.itemHead}><h3 className={styles.itemTitle}>{item.opening_title ?? "Oferta"}</h3><Badge variant="status" tone={statusTone(participationStatusTones, item.display_status)}><span className="min-w-0 break-words">{candidateStatusLabels[item.display_status] ?? "Resultado registrado"}</span></Badge></div>
          <p className={styles.itemMeta}><CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Recibida: {receivedOn(item.created_at)}</p>
        </Card>
      </li>)}</ul>
    </section>}

    <section aria-labelledby="dashboard-atajos" className={styles.dashboardSection}>
      <h2 id="dashboard-atajos" className={styles.sectionTitle}>Atajos</h2>
      <ul className={styles.shortcuts}>
        <li><Link href={profileHref} className={styles.shortcut}><UserRound className="h-5 w-5" aria-hidden="true" />Completar mis datos</Link></li>
        <li><Link href={offersHref} className={styles.shortcut}><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />Ver ofertas vigentes</Link></li>
        <li><Link href={participationsHref} className={styles.shortcut}><FileText className="h-5 w-5" aria-hidden="true" />Revisar mis postulaciones</Link></li>
      </ul>
    </section>
  </>;
}
