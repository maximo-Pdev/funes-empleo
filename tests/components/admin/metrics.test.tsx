import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/features/metrics/components/dashboard";
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
    expect(screen.getByText("0")).toBeDefined();
    expect(screen.getByText("Pendiente de cubrir todas las vacantes")).toBeDefined();
  });
  it("ofrece estado vacío sin simular datos", () => {
    render(<Dashboard rows={[]} />);
    expect(screen.getByText(/No hay ofertas publicadas/)).toBeDefined();
    render(<ContactTimeline contacts={[]} />);
    expect(screen.getByText("No hay contactos registrados para este caso.")).toBeDefined();
  });
});

vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
