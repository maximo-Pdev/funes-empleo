import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "@/features/metrics/components/dashboard";
import { ContactTimeline } from "@/features/participations/components/contact-timeline";
describe("métricas accesibles", () => {
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
