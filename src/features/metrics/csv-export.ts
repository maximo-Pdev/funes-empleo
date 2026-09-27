import type { MetricRow, MetricsFilters } from "@/validation/metrics";

export function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
// Bounded chunks; no CSV contents in logs, storage or audit.
export function metricsCsv(filters: MetricsFilters, rows: readonly MetricRow[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = -1;
  return new ReadableStream({
    pull(controller) {
      if (index === -1) {
        controller.enqueue(encoder.encode("\uFEFFperiodo_desde,periodo_hasta,categoria_codigo,categoria,indicador,valor,unidad,estado_calculo,oferta_codigo,oferta_titulo\r\n"));
        index = 0;
      } else if (index < rows.length) {
        const r = rows[index++];
        if (!r) { controller.close(); return; }
        controller.enqueue(encoder.encode([filters.from, filters.to, r.category_id, r.category_name,
          r.indicator, r.value, r.unit, r.state, r.opening_id, r.opening_title].map(csvCell).join(",") + "\r\n"));
      } else controller.close();
    },
  });
}
