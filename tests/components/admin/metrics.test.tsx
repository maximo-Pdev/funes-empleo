import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/features/metrics/components/dashboard";
import { ContactTimeline } from "@/features/participations/components/contact-timeline";
describe("métricas accesibles", () => {
  it("distingue cero, pendientes y vacío", () => {
    render(<Dashboard rows={[
      { indicator: "active_candidates", value: 0, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
      { indicator: "coverage_days", value: null, unit: "days", state: "pending", category_id: null, category_name: null, opening_id: "fixture", opening_title: "Oferta ficticia" },
    ]} />);
    expect(screen.getByTestId("metric-active_candidates").querySelector("dd")?.textContent).toBe("0");
    expect(screen.getByText("Pendiente de cubrir todas las vacantes")).toBeDefined();
  });
  it("prioriza seis indicadores sin sumar categorías y ofrece dos gráficos con detalle cerrado", () => {
    const row = { unit: "count" as const, state: "calculated" as const, category_id: null, category_name: null, opening_id: null, opening_title: null };
    const { container } = render(<Dashboard rows={[
      { ...row, indicator: "hired", value: 0 },
      { ...row, indicator: "preinterviews", value: 12 },
      { ...row, indicator: "category_hired", value: 3, category_id: "ficticio", category_name: "Oficios" },
    ]} />);
    expect(container.querySelectorAll('[data-testid^="metric-"]')).toHaveLength(6);
    expect(screen.getByTestId("metric-hired").querySelector("dd")?.textContent).toBe("0");
    expect(screen.getByTestId("metric-companies_active").querySelector("dd")?.textContent).toBe("No disponible");
    expect(screen.getByRole("figure", { name: "Resultados de las participaciones" })).toBeDefined();
    expect(screen.getByRole("figure", { name: "Contrataciones por categoría" }).textContent).toContain("Oficios3");
    expect(screen.getByText("Ver detalle").closest("details")).toHaveProperty("open", false);
    expect(screen.getByTestId("detail-metric-preinterviews").textContent).toContain("12");
  });
  it("ofrece estado vacío sin simular datos", () => {
    render(<Dashboard rows={[]} />);
    expect(screen.getByText(/No hay ofertas publicadas/)).toBeDefined();
    render(<ContactTimeline contacts={[]} />);
    expect(screen.getByText("No hay contactos registrados para este caso.")).toBeDefined();
  });
});

vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
