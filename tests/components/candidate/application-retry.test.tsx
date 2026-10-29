import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), offers: vi.fn(), selected: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/participations/candidate-service", () => ({ listMyParticipations: mocks.list }));
vi.mock("@/features/participations/candidate-actions", () => ({ withdrawParticipationAction: vi.fn() }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: mocks.offers, getPublicOffer: mocks.selected }));
import { renderCandidateOffersContent } from "@/app/(candidate)/candidato/_components/offers-content";

const offer = { id: "offer-fictitious", slug: "oferta-ficticia", title: "Oferta ficticia", company_name: "Empresa ficticia", location: "Funes", closing_date: "2026-11-01" };
const workspace = { bootstrap: "ready", profile: { status: "active", availability: "available", version: 1 }, cv: { original_name_safe: "general.pdf" }, consent: { status: "accepted" } };
const content = () => renderCandidateOffersContent({ workspace: workspace as Parameters<typeof renderCandidateOffersContent>[0]["workspace"] });

it("permite reintentar tras retiro y limpia éxito de la instancia anterior", async () => {
  mocks.offers.mockResolvedValue({ items: [offer], total: 1, page: 1, pageSize: 10 });
  mocks.list.mockResolvedValue([]);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const view = render(await content());
  expect(screen.getByText(/Cierre: 01\/11\/2026/)).toBeTruthy();
  fireEvent.submit(view.container.querySelector("form")!);
  expect(await screen.findByText("Participación registrada")).toHaveProperty("disabled", true);
  mocks.list.mockResolvedValue([{ id: "attempt-1", opening_id: offer.id, display_status: "received" }]);
  view.rerender(await content());
  expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
  mocks.list.mockResolvedValue([{ id: "attempt-1", opening_id: offer.id, display_status: "withdrawn" }]);
  view.rerender(await content());
  expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", false);
  expect(screen.getByLabelText("CV específico para esta oferta (opcional)")).toBeTruthy();
});
it.each(["received", "hired", "not_selected", "cancelled", "no_company_response"])("bloquea un caso %s aunque existan retiros", async display_status => {
  mocks.offers.mockResolvedValue({ items: [offer], total: 1, page: 1, pageSize: 10 });
  mocks.list.mockResolvedValue([{ id: "old", opening_id: offer.id, display_status: "withdrawn" }, { id: "new", opening_id: offer.id, display_status }]);
  render(await content());
  expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
});
