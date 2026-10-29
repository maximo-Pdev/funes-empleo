import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Dashboard, metricLabel } from "@/features/metrics/components/dashboard";
import { metricLabel as centralMetricLabel } from "@/features/metrics/labels";
import { ContactTimeline } from "@/features/participations/components/contact-timeline";
describe("métricas accesibles", () => {
  it("presents real counts as bars and opening states as a distribution", () => {
    const base = { unit: "count" as const, state: "calculated" as const, category_id: null, category_name: null, opening_id: null, opening_title: null };
    render(<Dashboard rows={[
      { ...base, indicator: "active_candidates", value: 12 },
      { ...base, indicator: "openings_published", value: 3 },
      { ...base, indicator: "openings_closed", value: 1 },
      { ...base, indicator: "category_active_candidates", value: 8, category_id: "test", category_name: "Comercio" },
    ]} />);
    expect(screen.getByRole("figure", { name: "Ofertas por estado" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Conteos del período" }).querySelectorAll("[data-metric-bar]")).toHaveLength(3);
    expect(screen.getByRole("figure", { name: "Ofertas por estado" }).textContent).not.toContain("Comercio");
    expect(screen.getByTestId("metric-active_candidates").textContent).toContain("12");
  });
  it("distingue cero, pendientes y vacío", () => {
    render(<Dashboard rows={[
      { indicator: "active_candidates", value: 0, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
      { indicator: "coverage_days", value: null, unit: "days", state: "pending", category_id: null, category_name: null, opening_id: "fixture", opening_title: "Oferta ficticia" },
    ]} />);
    expect(screen.getByTestId("metric-active_candidates").querySelector("dd")?.textContent).toBe("0");
    expect(screen.getByText("Pendiente de cubrir todas las vacantes")).toBeDefined();
  });
  it("replaces the six-card summary with visible charts and preserves every supplied count", () => {
    const row = { unit: "count" as const, state: "calculated" as const, category_id: null, category_name: null, opening_id: null, opening_title: null };
    const { container } = render(<Dashboard rows={[
      { ...row, indicator: "hired", value: 0 },
      { ...row, indicator: "preinterviews", value: 12 },
      { ...row, indicator: "category_hired", value: 3, category_id: "ficticio", category_name: "Oficios" },
    ]} />);
    expect(container.querySelectorAll('[data-testid^="metric-"]')).toHaveLength(2);
    expect(screen.getByTestId("metric-hired").querySelector("dd")?.textContent).toBe("0");
    expect(screen.getByTestId("metric-preinterviews").querySelector("dd")?.textContent).toBe("12");
    expect(container.querySelectorAll("[data-metric-bar]")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Distribución por categoría" }).textContent).toContain("Oficios: Contrataciones por categoría — 3");
    expect(screen.queryByText("Indicadores principales")).toBeNull();
    expect(screen.queryByText("Ver detalle")).toBeNull();
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByTestId("metric-preinterviews").closest("details")).toBeNull();
  });
  it("keeps labels centralized and distinguishes unavailable counts from zero", () => {
    expect(metricLabel).toBe(centralMetricLabel);
    const base = { unit: "count" as const, state: "calculated" as const, category_id: null, category_name: null, opening_id: null, opening_title: null };
    render(<Dashboard rows={[
      { ...base, indicator: "active_candidates", value: 0 },
      { ...base, indicator: "companies_active", value: null },
      { ...base, indicator: "coverage_days", unit: "days", value: null, opening_id: "unavailable", opening_title: "Oferta ficticia" },
    ]} />);
    expect(screen.getByTestId("metric-active_candidates").querySelector("dd")?.textContent).toBe("0");
    const unavailable = screen.getByTestId("metric-companies_active");
    expect(unavailable.querySelector("dd")?.textContent).toBe("No disponible");
    expect(unavailable.querySelector("[data-metric-bar]")?.childElementCount).toBe(0);
    expect(screen.getByTestId("duration-coverage_days-unavailable").textContent).toContain("No disponible");
    expect(screen.queryByText(/undefined días/)).toBeNull();
  });
  it("uses exclusive opening states instead of overlapping totals or categories in the donut", () => {
    const base = { unit: "count" as const, state: "calculated" as const, category_id: null, category_name: null, opening_id: null, opening_title: null };
    const chart = <Dashboard rows={[
      { ...base, indicator: "openings_published", value: 3 },
      { ...base, indicator: "openings_closed", value: 1 },
      { ...base, indicator: "openings_total", value: 4 },
      { ...base, indicator: "category_hired", value: 9, category_id: "overlap", category_name: "Oficios" },
    ]} />;
    render(chart);
    const distribution = screen.getByRole("figure", { name: "Ofertas por estado" });
    expect(distribution.querySelectorAll("li")).toHaveLength(2);
    expect(distribution.textContent).toContain("Ofertas publicadas: 3");
    expect(distribution.textContent).toContain("Ofertas cerradas: 1");
    expect(distribution.textContent).not.toContain("Oficios");
    expect(renderToStaticMarkup(chart)).toContain("0% 75%");
    expect(renderToStaticMarkup(chart)).toContain("75% 100%");
  });
  it.each([0, null])("does not manufacture a donut for zero or unavailable states (%s)", value => {
    const base = { unit: "count" as const, state: "calculated" as const, category_id: null, category_name: null, opening_id: null, opening_title: null };
    render(<Dashboard rows={[
      { ...base, indicator: "openings_published", value },
      { ...base, indicator: "openings_closed", value: value === null ? 2 : 0 },
    ]} />);
    const distribution = screen.getByRole("figure", { name: "Ofertas por estado" });
    expect(distribution.querySelector('[style*="conic-gradient"]')).toBeNull();
    expect(distribution.textContent).toContain(value === null ? "La distribución no está disponible" : "No hay ofertas en los estados informados");
    expect(distribution.textContent).toContain(value === null ? "Ofertas publicadas: No disponible" : "Ofertas publicadas: 0");
  });
  it("ofrece estado vacío sin simular datos", () => {
    render(<Dashboard rows={[]} />);
    expect(screen.getByText(/No hay ofertas publicadas/)).toBeDefined();
    render(<ContactTimeline contacts={[]} />);
    expect(screen.getByText("No hay contactos registrados para este caso.")).toBeDefined();
  });
});

vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
