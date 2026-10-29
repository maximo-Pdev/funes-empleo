import "server-only";
import { referenceUrl } from "@/lib/records/reference-url";
import { recordReferences, routeIdentifier } from "@/lib/records/references";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
import { getMetrics, metricsSession, MetricsHistoryUnavailable } from "./service";
import type { MetricsReport } from "./report-data";

export function metricsDownload(serialize: (report: MetricsReport) => Promise<Buffer>, contentType: string, filename: string) {
  return async function GET(request: Request) {
    const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
    try {
      await metricsSession();
      const url = new URL(request.url);
      const params = url.searchParams;
      if ([...params.keys()].some(key => params.getAll(key).length !== 1 || !["from", "to", "category"].includes(key))) throw new AppError("VALIDATION_ERROR");
      const canonical = await referenceUrl(url.pathname + url.search);
      if (canonical !== url.pathname + url.search) return new Response(null, { status: 307, headers: { ...headers, Location: canonical } });
      const query = Object.fromEntries(params);
      if (query.category) query.category = await routeIdentifier("category", query.category);
      const result = await getMetrics(query, true);
      const [categories, openings] = await Promise.all([
        recordReferences("category", result.rows.map(row => row.category_id).concat(result.filters.category)),
        recordReferences("opening", result.rows.map(row => row.opening_id)),
      ]);
      const bytes = await serialize({ filters: result.filters, asOf: result.as_of, rows: result.rows, references: { categories, openings } });
      return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"` } });
    } catch (e) {
      const error = e instanceof MetricsHistoryUnavailable ? { message: "No hay evidencia histórica suficiente para ese período." } : publicErrorFrom(e);
      const status = e instanceof AppError && ["ACCESS_DENIED", "AUTH_REQUIRED"].includes(e.code) ? 403 : 400;
      return Response.json(error, { status, headers });
    }
  };
}
