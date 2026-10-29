// @vitest-environment node
import { expect, it, vi } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import readExcelFile from "read-excel-file/node";
import { unzipSync, strFromU8 } from "fflate";
vi.mock("server-only", () => ({}));
import { metricsXlsx } from "@/features/metrics/xlsx-export";
import { metricsPdf } from "@/features/metrics/pdf-export";
import type { MetricsReport } from "@/features/metrics/report-data";

const id = "0a000000-0000-4000-8000-000000000001";
const report: MetricsReport = {
  filters: { from: "2026-10-01", to: "2026-10-20", category: id }, asOf: "2026-10-20T18:00:00Z",
  references: { categories: { [id]: "rub-111111111111111111111111" }, openings: { [id]: "ofe-222222222222222222222222" } },
  rows: [
    { indicator: "active_candidates", value: 0, unit: "count", state: "calculated", category_id: id, category_name: "Administración y atención", opening_id: null, opening_title: null },
    { indicator: "coverage_days", value: null, unit: "days", state: "pending", category_id: id, category_name: "Administración y atención", opening_id: id, opening_title: "=OFERTA FICTICIA ñ áéíóúü ¿¡" },
    { indicator: "first_hire_days", value: 1.25, unit: "days", state: "calculated", category_id: null, category_name: null, opening_id: id, opening_title: "+Oferta ficticia" },
  ],
};
it("genera Excel legible con números reales, pendientes y texto sin fórmulas ni UUID", async () => {
  const bytes = await metricsXlsx(report);
  const sheets = await readExcelFile(bytes);
  expect(sheets.map(sheet => sheet.sheet)).toEqual(["Contexto", "Métricas"]);
  const context = sheets.find(sheet => sheet.sheet === "Contexto")!.data;
  expect(context).toContainEqual(["Desde", "01/10/2026"]);
  expect(context).toContainEqual(["Hasta", "20/10/2026"]);
  expect(context).toContainEqual(["Foto de consulta", "20/10/2026, 15:00:00"]);
  const rows = sheets.find(sheet => sheet.sheet === "Métricas")!.data;
  expect(rows[1]![1]).toBe(0);
  expect(rows[2]![1]).toBeNull();
  expect(rows[2]![3]).toBe("Pendiente");
  expect(rows[2]![6]).toBe("=OFERTA FICTICIA ñ áéíóúü ¿¡");
  expect(rows[3]![1]).toBe(1.25);
  const zip = unzipSync(new Uint8Array(bytes));
  const xml = Object.entries(zip).filter(([name]) => name.endsWith(".xml") || name.endsWith(".rels")).map(([, value]) => strFromU8(value)).join("\n");
  expect(xml).not.toMatch(/<f(?:\s|>)|TargetMode="External"|vbaProject|0a000000-0000-4000-8000-000000000001/);
  expect(xml).toContain(report.references.openings[id]);
  expect(xml).toContain("Administración y atención");
  await mkdir("test-results/portal-files", { recursive: true });
  await writeFile("test-results/portal-files/metricas.xlsx", bytes);
});
it("genera PDF paginado real con fuente embebida y sin truncar una lista extensa", async () => {
  const rows = Array.from({ length: 80 }, (_, index) => ({ ...report.rows[index % 3]!, opening_title: `Oferta ficticia ${index + 1}: ` + "Experiencia y atención en administración. ".repeat(6) }));
  const bytes = await metricsPdf({ ...report, rows });
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.toString("latin1")).toContain("%%EOF");
  expect(bytes.toString("latin1")).toMatch(/FontFile2|FontFile3/);
  expect((bytes.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(2);
  expect(bytes.toString("latin1")).not.toContain(id);
  await mkdir("test-results/portal-files", { recursive: true });
  await writeFile("test-results/portal-files/metricas.pdf", bytes);
  await writeFile("test-results/portal-files/metricas-corto.pdf", await metricsPdf(report));
});
