import type { MetricRow, MetricsFilters } from "@/validation/metrics";
import { metricLabel } from "./labels";

export type MetricsReport = {
  filters: MetricsFilters; asOf: string; rows: readonly MetricRow[];
  references: { categories: Record<string, string>; openings: Record<string, string> };
};
export function reportContext(report: MetricsReport) {
  const category = report.filters.category;
  const categoryName = category ? report.rows.find(row => row.category_id === category)?.category_name : null;
  return [
    ["Informe", "Métricas operativas — Oficina de Empleo de Funes"],
    ["Desde", report.filters.from], ["Hasta", report.filters.to],
    ["Categoría", category ? [categoryName, report.references.categories[category]].filter(Boolean).join(" · ") || "Categoría seleccionada" : "Todas las categorías"],
    ["Foto de consulta", new Date(report.asOf).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires", hour12: false })],
    ["Alcance", "Información interna; no es un informe oficial municipal o provincial."],
    ["Interpretación", "Los desgloses por categorías no deben sumarse como un total único. Pendiente no equivale a cero."],
  ];
}
export function reportRow(row: MetricRow, references: MetricsReport["references"]) {
  return {
    indicator: metricLabel(row.indicator), value: row.value,
    unit: row.unit === "days" ? "Días" : "Cantidad",
    state: row.state === "pending" ? "Pendiente" : "Calculado",
    category: row.category_name ?? "", categoryCode: row.category_id ? references.categories[row.category_id] ?? "" : "",
    opening: row.opening_title ?? "", openingCode: row.opening_id ? references.openings[row.opening_id] ?? "" : "",
  };
}
