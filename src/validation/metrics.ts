import { z } from "zod";
import { databaseUuidSchema } from "./common";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
});
export const metricsFilterSchema = z.object({
  from: date, to: date,
  category: z.preprocess((v) => v === "" || v === undefined ? null : v, databaseUuidSchema.nullable()),
}).strict().refine((v) => v.from <= v.to, { message: "El período debe estar ordenado." });
export type MetricsFilters = z.infer<typeof metricsFilterSchema>;
export const metricRowSchema = z.object({
  indicator: z.string(), value: z.number().nullable(), unit: z.enum(["count", "days"]),
  state: z.enum(["calculated", "pending"]), category_id: databaseUuidSchema.nullable(),
  category_name: z.string().nullable(), opening_id: databaseUuidSchema.nullable(), opening_title: z.string().nullable(),
});
export const metricsResultSchema = z.object({ as_of: z.string(), history_from: z.string().nullable(), rows: z.array(metricRowSchema) });
export type MetricRow = z.infer<typeof metricRowSchema>;
export function metricsQuery(filters: MetricsFilters) {
  return new URLSearchParams({ from: filters.from, to: filters.to, ...(filters.category ? { category: filters.category } : {}) }).toString();
}
export function localToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
