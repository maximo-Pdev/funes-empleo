import type { MetricRow } from "@/validation/metrics";
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
  if (indicator.startsWith("companies_")) return `Empresas ${states[indicator.slice(10)] ?? indicator}`;
  if (indicator.startsWith("openings_")) return `Ofertas ${states[indicator.slice(9)] ?? indicator}`;
  return labels[indicator] ?? indicator;
}
export function Dashboard({ rows }: { rows: readonly MetricRow[] }) {
  const durations = rows.filter((r) => r.unit === "days");
  return <div className="space-y-6">
    <section aria-labelledby="metric-counts"><h2 id="metric-counts" className="mb-3 text-xl font-semibold">Conteos del período</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.filter((r) => r.unit === "count" && !r.indicator.startsWith("category_")).map((r) =>
        <div key={r.indicator} data-testid={`metric-${r.indicator}`} className="rounded border border-slate-300 bg-white p-4">
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
          <p className="break-all text-sm">Código: {r.opening_id}</p>
          <p>{metricLabel(r.indicator)}: <strong>{r.state === "pending" ? (r.indicator === "coverage_days" ? "Pendiente de cubrir todas las vacantes" : "Pendiente de primera contratación") : `${r.value?.toLocaleString("es-AR", { maximumFractionDigits: 2 })} días`}</strong></p>
        </li>)}</ul>}
    </section>
  </div>;
}
