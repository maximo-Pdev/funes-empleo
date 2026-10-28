import { RecordLabel } from "@/components/ui/record-link";
import type { MetricRow } from "@/validation/metrics";
import { metricLabel } from "../labels";
export { metricLabel } from "../labels";
const summaryIndicators = ["active_candidates", "companies_active", "openings_published", "applications", "referrals", "hired"] as const;
const outcomeIndicators = ["hired", "not_selected", "withdrawn", "cancelled", "no_company_response"] as const;
const formatCount = (value: number | null | undefined) => value == null ? "No disponible" : value.toLocaleString("es-AR");

function BarChart({ title, description, items }: {
  title: string; description: string; items: readonly { key: string; label: string; value: number | null }[];
}) {
  const max = Math.max(1, ...items.map(item => item.value ?? 0));
  return <figure className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5" aria-label={title}>
    <figcaption><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></figcaption>
    {items.length === 0 ? <p className="mt-4">No hay datos para este período y categoría.</p> : <ul className="mt-5 space-y-4">
      {items.map(item => <li key={item.key} className="space-y-1.5">
        <div className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0 break-words">{item.label}</span><strong className="shrink-0 tabular-nums">{formatCount(item.value)}</strong></div>
        <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-muted">
          {item.value != null && <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, item.value) / max * 100}%` }} />}
        </div>
      </li>)}
    </ul>}
  </figure>;
}

export function Dashboard({ rows }: { rows: readonly MetricRow[] }) {
  const counts = rows.filter(row => row.unit === "count");
  return <div className="space-y-6">
    <section aria-labelledby="metric-summary"><h2 id="metric-summary" className="mb-3 text-xl font-semibold">Indicadores principales</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{summaryIndicators.map(indicator => {
        const row = counts.find(item => item.indicator === indicator);
        return <div key={indicator} data-testid={`metric-${indicator}`} className="min-w-0 rounded-xl border border-border bg-card p-4">
          <dt className="text-sm text-muted-foreground">{metricLabel(indicator)}</dt><dd className="mt-2 font-heading text-3xl font-semibold tabular-nums">{formatCount(row?.value)}</dd>
        </div>;
      })}</dl>
    </section>
    <div className="grid gap-4 lg:grid-cols-2">
      <BarChart title="Resultados de las participaciones" description="Resultados confirmados dentro del período seleccionado."
        items={outcomeIndicators.map(indicator => ({ key: indicator, label: metricLabel(indicator), value: counts.find(row => row.indicator === indicator)?.value ?? null }))} />
      <BarChart title="Contrataciones por categoría" description="Una contratación puede pertenecer a varias categorías. No sumes las barras como un total único."
        items={counts.filter(row => row.indicator === "category_hired").map(row => ({ key: row.category_id ?? row.category_name ?? "unknown", label: row.category_name ?? "Categoría sin nombre", value: row.value }))} />
    </div>
    <details className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Ver detalle</summary>
      <div className="mt-5"><MetricDetails rows={rows} /></div>
    </details>
  </div>;
}

function MetricDetails({ rows }: { rows: readonly MetricRow[] }) {
  const durations = rows.filter((r) => r.unit === "days");
  return <div className="space-y-6">
    <section aria-labelledby="metric-counts"><h2 id="metric-counts" className="mb-3 text-xl font-semibold">Conteos del período</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.filter((r) => r.unit === "count" && !r.indicator.startsWith("category_")).map((r) =>
        <div key={r.indicator} data-testid={`detail-metric-${r.indicator}`} className="rounded border border-slate-300 bg-white p-4">
          <dt>{metricLabel(r.indicator)}</dt><dd className="text-2xl font-semibold">{r.value ?? "No calculable"}</dd>
        </div>)}</dl>
    </section>
    <section aria-labelledby="metric-trends"><h2 id="metric-trends" className="mb-3 text-xl font-semibold">Distribución por categoría</h2>
      <p className="mb-3">Una persona u oferta puede pertenecer a varias categorías; los desgloses no deben sumarse como un total único.</p>
      <ul className="space-y-2">{rows.filter((r) => r.indicator.startsWith("category_")).map((r) =>
        <li key={`${r.indicator}:${r.category_id}`} className="rounded border bg-white p-3">{r.category_name}: {metricLabel(r.indicator)} — <strong>{r.value}</strong></li>)}</ul>
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
