import { RecordLabel } from "@/components/ui/record-link";
import type { MetricRow } from "@/validation/metrics";
import styles from "./dashboard.module.css";
import { metricLabel } from "../labels";
export { metricLabel } from "../labels";
const openingIndicators = new Set(["openings_draft", "openings_pending_review", "openings_changes_requested", "openings_published", "openings_paused", "openings_closed", "openings_rejected", "openings_cancelled", "openings_archived"]);
const formatCount = (value: number | null) => value === null ? "No disponible" : value.toLocaleString("es-AR");

export function Dashboard({ rows }: { rows: readonly MetricRow[] }) {
  const durations = rows.filter((r) => r.unit === "days");
  const counts = rows.filter(r => r.unit === "count" && !r.indicator.startsWith("category_"));
  const maximum = Math.max(1, ...counts.map(r => r.value ?? 0));
  const categories = rows.filter(r => r.unit === "count" && r.indicator.startsWith("category_"));
  const categoryMaximum = Math.max(1, ...categories.map(r => r.value ?? 0));
  // Only exclusive snapshot states belong in the donut, never overlapping totals.
  const openingStates = counts.filter(r => openingIndicators.has(r.indicator));
  const distributionAvailable = openingStates.length > 0 && openingStates.every(r => r.value !== null);
  const openingTotal = openingStates.reduce((total, row) => total + (row.value ?? 0), 0);
  const colors = ["var(--color-brand-primary)", "var(--color-status-blue)", "var(--color-status-violet)", "var(--color-status-amber)", "var(--color-status-red)", "var(--color-status-neutral)", "var(--color-primary-400)", "var(--color-brand-text)"];
  const slices = openingStates.reduce<{ position: number; stops: string[] }>((chart, row, index) => {
    const position = chart.position + (openingTotal > 0 ? (row.value ?? 0) / openingTotal * 100 : 0);
    return { position, stops: [...chart.stops, `${colors[index % colors.length]} ${chart.position}% ${position}%`] };
  }, { position: 0, stops: [] }).stops;
  return <div className="space-y-6" data-metrics-chart-first>
    <div className={styles.overview}>
    <section aria-labelledby="metric-counts"><h2 id="metric-counts" className="mb-3 text-xl font-semibold">Conteos del período</h2>
      <p className="mb-3">Candidatos, empresas y ofertas: foto al cierre del período. Participaciones, preentrevistas, derivaciones y resultados: eventos dentro del período, no una tendencia histórica.</p>
      {counts.length === 0 && <p>No hay conteos disponibles para este período.</p>}
      <dl className={styles.counts}>{counts.map((r) =>
        <div key={r.indicator} data-testid={`metric-${r.indicator}`} className={styles.count}>
          <dt>{metricLabel(r.indicator)}</dt><dd>{formatCount(r.value)}</dd>
          <div className={styles.track} data-metric-bar aria-hidden="true">{r.value !== null && <div className={styles.bar} style={{ width: `${Math.max(0, r.value) / maximum * 100}%` }} />}</div>
        </div>)}</dl>
    </section>
    <figure className={styles.distribution} aria-labelledby="opening-distribution">
      <figcaption id="opening-distribution">Ofertas por estado</figcaption>
      <p className="mb-3">Foto al cierre del período; cada oferta pertenece a un solo estado.</p>
      {distributionAvailable && openingTotal > 0
        ? <div className={styles.donut} aria-hidden="true" style={{ background: `conic-gradient(${slices.join(", ")})` }} />
        : <p>{distributionAvailable ? "No hay ofertas en los estados informados para este período." : "La distribución no está disponible para este período."}</p>}
      <ul className={styles.legend}>{openingStates.map((row, index) => <li key={row.indicator}>
        <span className={styles.swatch} style={{ background: colors[index % colors.length] }} aria-hidden="true" />
        <span>{metricLabel(row.indicator)}: <strong>{formatCount(row.value)}</strong></span>
      </li>)}</ul>
    </figure>
    </div>
    <section aria-labelledby="metric-trends"><h2 id="metric-trends" className="mb-3 text-xl font-semibold">Distribución por categoría</h2>
      <p className="mb-3">Una persona u oferta puede pertenecer a varias categorías; los desgloses no deben sumarse como un total único.</p>
      {categories.length === 0 && <p>No hay datos por categoría para este período.</p>}
      <ul className={styles.categories}>{categories.map((r) =>
        <li key={`${r.indicator}:${r.category_id}`} className={styles.category}>{r.category_name ?? "Categoría sin nombre"}: {metricLabel(r.indicator)} — <strong>{formatCount(r.value)}</strong>
          <div className={styles.track} data-metric-bar aria-hidden="true">{r.value !== null && <div className={styles.bar} style={{ width: `${Math.max(0, r.value) / categoryMaximum * 100}%` }} />}</div>
        </li>)}</ul>
    </section>
    <section aria-labelledby="metric-durations"><h2 id="metric-durations" className="mb-3 text-xl font-semibold">Tiempos por oferta</h2>
      {durations.length === 0 ? <p>No hay ofertas publicadas en este período y categoría. Los conteos cero no equivalen a tiempos de cero días.</p> :
        <ul className="grid gap-3 sm:grid-cols-2">{durations.map((r) => <li key={`${r.indicator}:${r.opening_id}`} data-testid={`duration-${r.indicator}-${r.opening_id}`} className="rounded border bg-white p-4">
          <h3 className="font-semibold break-words">{r.opening_title ?? "Oferta sin título"}</h3>
          <p className="break-all text-sm">Código: {r.opening_id && <RecordLabel kind="opening" id={r.opening_id} />}</p>
          <p>{metricLabel(r.indicator)}: <strong>{r.state === "pending" ? (r.indicator === "coverage_days" ? "Pendiente de cubrir todas las vacantes" : "Pendiente de primera contratación") : r.value === null ? "No disponible" : `${r.value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} días`}</strong></p>
        </li>)}</ul>}
    </section>
  </div>;
}
