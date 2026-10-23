import { referenceUrl } from "@/lib/records/reference-url";
import { recordReferences, routeIdentifier } from "@/lib/records/references";
import { getMetrics, metricsSession, MetricsHistoryUnavailable } from "@/features/metrics/service";
import { metricsCsv } from "@/features/metrics/csv-export";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some((key) => params.getAll(key).length !== 1)) throw new AppError("VALIDATION_ERROR");
    await metricsSession();
    const url = new URL(request.url);
    const canonical = await referenceUrl(url.pathname + url.search);
    if (canonical !== url.pathname + url.search) return new Response(null, { status: 307, headers: { ...headers, Location: canonical } });
    const query = Object.fromEntries(params);
    if (query.category) query.category = await routeIdentifier("category", query.category);
    const result = await getMetrics(query, true);
    const [categories, openings] = await Promise.all([
      recordReferences("category", result.rows.map(row => row.category_id)),
      recordReferences("opening", result.rows.map(row => row.opening_id)),
    ]);
    return new Response(metricsCsv(result.filters, result.rows, { categories, openings }), { headers: { ...headers,
      "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="metricas.csv"' } });
  } catch (e) {
    const error = e instanceof MetricsHistoryUnavailable ? { message: "No hay evidencia histórica suficiente para ese período." } : publicErrorFrom(e);
    const status = e instanceof AppError && ["ACCESS_DENIED", "AUTH_REQUIRED"].includes(e.code) ? 403 : 400;
    return Response.json(error, { status, headers });
  }
}
