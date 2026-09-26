import { describe, expect, it } from "vitest";
import { metricsFilterSchema } from "@/validation/metrics";
import { csvCell, metricsCsv } from "@/features/metrics/csv-export";
import { orderContacts } from "@/features/participations/contact-order";
import { messageTemplate } from "@/features/participations/message-templates";

describe("métricas y seguimiento", () => {
  it("valida fechas reales y orden sin aceptar filtros ajenos", () => {
    expect(metricsFilterSchema.safeParse({ from: "2026-02-30", to: "2026-03-01" }).success).toBe(false);
    expect(metricsFilterSchema.safeParse({ from: "2026-10-01", to: "2026-09-01" }).success).toBe(false);
    expect(metricsFilterSchema.safeParse({ from: "2026-09-01", to: "2026-09-30", owner: "x" }).success).toBe(false);
    expect(metricsFilterSchema.parse({ from: "2026-09-01", to: "2026-09-20", category: "" }).category).toBeNull();
  });
  it.each(["=SUM(1)", "+1", "-1", "@a", "\ttest", "\rtest"])("neutraliza %j", (value) => {
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
  it("escapa comillas, preserva cero y deja vacío lo pendiente", async () => {
    expect(csvCell('Oferta, "ficticia"')).toBe('"Oferta, ""ficticia"""');
    const csv = await new Response(metricsCsv({ from: "2026-09-01", to: "2026-09-20", category: null }, [
      { indicator: "active_candidates", value: 0, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
      { indicator: "coverage_days", value: null, unit: "days", state: "pending", category_id: null, category_name: null, opening_id: "fixture", opening_title: "=DEMO" },
    ])).text();
    expect(csv).toContain('"0"');
    expect(csv).toContain('"coverage_days","","days","pending"');
    expect(csv).toContain('"\'=DEMO"');
    expect(csv).not.toMatch(/dni|candidate_id|email|summary_internal/);
  });
  it("ordena contactos cronológicamente de manera determinista sin mutar entrada", () => {
    const values = [{ id: "b", occurred_at: "2026-09-20T00:00:00Z" }, { id: "a", occurred_at: "2026-09-19T00:00:00Z" }];
    expect(orderContacts(values).map((v) => v.id)).toEqual(["a", "b"]);
    expect(values[0]?.id).toBe("b");
  });
  it("plantillas sin datos personales ni envío automático", () => {
    expect(messageTemplate("follow_up")).toContain("Oficina de Empleo");
    expect(messageTemplate("appointment")).not.toMatch(/https:|mailto:|wa.me/);
  });
});
