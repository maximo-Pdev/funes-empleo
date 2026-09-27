import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { localToday, metricsFilterSchema, metricsResultSchema } from "@/validation/metrics";

export class MetricsHistoryUnavailable extends Error {}
export async function metricsSession() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  return session;
}
export async function getMetrics(input: unknown, exporting = false) {
  const session = await metricsSession();
  const parsed = metricsFilterSchema.safeParse(input);
  if (!parsed.success || parsed.data.to > localToday()) throw new AppError("VALIDATION_ERROR");
  const filters = parsed.data;
  const result = await session.client.rpc(exporting ? "export_admin_metrics" : "admin_metrics", {
    p_from: filters.from, p_to: filters.to, p_category: filters.category,
  });
  if (result.error?.message === "METRICS_HISTORY_UNAVAILABLE") {
    const coverage = await session.client.rpc("metrics_history_start");
    throw new MetricsHistoryUnavailable(coverage.error ? "" : coverage.data ?? "");
  }
  if (result.error) throw workflowRpcError(result.error.message);
  return { filters, ...metricsResultSchema.parse(result.data) };
}
export async function metricsCategories() {
  const { client } = await metricsSession();
  // Inactive categories remain selectable for historical queries.
  const result = await client.from("job_categories").select("id,name,code,version").order("name");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return result.data;
}
