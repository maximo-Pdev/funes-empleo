import { getMetrics, MetricsHistoryUnavailable } from "@/features/metrics/service";
import { metricsCsv } from "@/features/metrics/csv-export";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some((key) => params.getAll(key).length !== 1)) throw new AppError("VALIDATION_ERROR");
    const result = await getMetrics(Object.fromEntries(params), true);
    return new Response(metricsCsv(result.filters, result.rows), { headers: { ...headers,
      "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="metricas.csv"' } });
  } catch (e) {
    const error = e instanceof MetricsHistoryUnavailable ? { message: "No hay evidencia histórica suficiente para ese período." } : publicErrorFrom(e);
    const status = e instanceof AppError && ["ACCESS_DENIED", "AUTH_REQUIRED"].includes(e.code) ? 403 : 400;
    return Response.json(error, { status, headers });
  }
}
