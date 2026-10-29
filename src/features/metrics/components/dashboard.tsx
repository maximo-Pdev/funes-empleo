import { RecordLabel } from "@/components/ui/record-link";
import type { MetricRow } from "@/validation/metrics";
import styles from "./dashboard.module.css";
const labels: Record<string, string> = {
  active_candidates: "Candidatos activos", companies: "Empresas", applications: "Postulaciones y nominaciones",
  preinterviews: "Preentrevistas registradas", referrals: "Derivaciones", hired: "Contrataciones confirmadas",
  not_selected: "No selecciones", withdrawn: "Retiros", cancelled: "Cancelaciones", no_company_response: "Cierres sin respuesta",
  first_hire_days: "Días hasta primera contratación", coverage_days: "Días hasta cobertura total",
  category_active_candidates: "Candidatos activos por categoría", category_applications: "Participaciones por categoría", category_hired: "Contrataciones por categoría",
};
const states: Record<string, string> = { active: "activas", incomplete: "incompletas", suspended: "suspendidas", archived: "archivadas",
  draft: "en borrador", pending_review: "pendientes de revisión", changes_requested: "con correcciones solicitadas", published: "publicadas",
  paused: "pausadas", closed: "cerradas", rejected: "rechazadas", cancelled: "canceladas" };
export function metricLabel(indicator: string) {
  if (indicator.startsWith("companies_")) return `Empresas ${states[indicator.slice(10)] ?? "con estado no reconocido"}`;
  if (indicator.startsWith("openings_")) return `Ofertas ${states[indicator.slice(9)] ?? "con estado no reconocido"}`;
  return labels[indicator] ?? "Indicador no reconocido";
}
export function Dashboard({ rows }: { rows: readonly MetricRow[] }) {
  const durations = rows.filter((r) => r.unit === "days");
  const counts = rows.filter(r => r.unit === "count" && !r.indicator.startsWith("category_"));
  const maximum = Math.max(1, ...counts.map(r => r.value ?? 0));
  const openingStates = counts.filter(r => r.indicator.startsWith("openings_") && r.value !== null);
  const openingTotal = openingStates.reduce((total, row) => total + (row.value ?? 0), 0);
  const colors = ["var(--color-brand-primary)", "var(--color-status-blue)", "var(--color-status-violet)", "var(--color-status-amber)", "var(--color-status-red)", "var(--color-status-neutral)", "var(--color-primary-400)", "var(--color-brand-text)"];
  const slices = openingStates.reduce<{ position: number; stops: string[] }>((chart, row, index) => {
    const position = chart.position + (openingTotal > 0 ? (row.value ?? 0) / openingTotal * 100 : 0);
    return { position, stops: [...chart.stops, `${colors[index % colors.length]} ${chart.position}% ${position}%`] };
  }, { position: 0, stops: [] }).stops;
  return <div className="space-y-6">
    <div className={styles.overview}>
    <section aria-labelledby="metric-counts"><h2 id="metric-counts" className="mb-3 text-xl font-semibold">Conteos del período</h2>
      {counts.length === 0 && <p>No hay conteos disponibles para este período.</p>}
      <dl className={styles.counts}>{counts.map((r) =>
        <div key={r.indicator} data-testid={`metric-${r.indicator}`} className={styles.count}>
          <dt>{metricLabel(r.indicator)}</dt><dd>{r.value?.toLocaleString("es-AR") ?? "No calculable"}</dd>
          <div className={styles.track} data-metric-bar aria-hidden="true"><div className={styles.bar} style={{ width: `${(r.value ?? 0) / maximum * 100}%` }} /></div>
        </div>)}</dl>
    </section>
    <figure className={styles.distribution} aria-labelledby="opening-distribution">
      <figcaption id="opening-distribution">Ofertas por estado</figcaption>
      {openingTotal > 0 ? <div className={styles.distributionBody}>
        <div className={styles.donut} aria-hidden="true" style={{ background: `conic-gradient(${slices.join(", ")})` }} />
        <ul className={styles.legend}>{openingStates.map((row, index) => <li key={row.indicator}>
          <span className={styles.swatch} style={{ background: colors[index % colors.length] }} aria-hidden="true" />
          <span>{metricLabel(row.indicator)}: <strong>{row.value?.toLocaleString("es-AR")}</strong></span>
        </li>)}</ul>
      </div> : <p>{openingStates.length > 0 ? "No hay ofertas en los estados informados para este período." : "La distribución no está disponible para este período."}</p>}
    </figure>
    </div>
    <section aria-labelledby="metric-trends"><h2 id="metric-trends" className="mb-3 text-xl font-semibold">Distribución por categoría</h2>
      <p className="mb-3">Una persona u oferta puede pertenecer a varias categorías; los desgloses no deben sumarse como un total único.</p>
      <ul className={styles.categories}>{rows.filter((r) => r.indicator.startsWith("category_")).map((r) =>
        <li key={`${r.indicator}:${r.category_id}`} className={styles.category}>{r.category_name}: {metricLabel(r.indicator)} — <strong>{r.value?.toLocaleString("es-AR") ?? "No calculable"}</strong></li>)}</ul>
    </section>
    <section aria-labelledby="metric-durations"><h2 id="metric-durations" className="mb-3 text-xl font-semibold">Tiempos por oferta</h2>
      {durations.length === 0 ? <p>No hay ofertas publicadas en este período y categoría. Los conteos cero no equivalen a tiempos de cero días.</p> :
        <ul className="grid gap-3 sm:grid-cols-2">{durations.map((r) => <li key={`${r.indicator}:${r.opening_id}`} data-testid={`duration-${r.indicator}-${r.opening_id}`} className="rounded border bg-white p-4">
          <h3 className="font-semibold break-words">{r.opening_title ?? "Oferta sin título"}</h3>
          <p className="break-all text-sm">Código: {r.opening_id && <RecordLabel kind="opening" id={r.opening_id} />}</p>
          <p>{metricLabel(r.indicator)}: <strong>{r.state === "pending" ? (r.indicator === "coverage_days" ? "Pendiente de cubrir todas las vacantes" : "Pendiente de primera contratación") : `${r.value?.toLocaleString("es-AR", { maximumFractionDigits: 2 })} días`}</strong></p>
        </li>)}</ul>}
    </section>
  </div>;
}
