import { expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ apply: vi.fn(), refresh: vi.fn(), offers: vi.fn(), selected: vi.fn(), participations: vi.fn() }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: mocks.offers, getPublicOffer: mocks.selected }));
vi.mock("@/features/participations/candidate-service", () => ({ listMyParticipations: mocks.participations }));
import { renderCandidateOffersContent } from "@/app/(candidate)/candidato/_components/offers-content";
import { renderCandidateParticipationsContent } from "@/app/(candidate)/candidato/_components/participations-content";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/participations/candidate-actions", () => ({ applyToOfferAction: mocks.apply, withdrawParticipationAction: vi.fn() }));
import { CandidateApplyForm } from "@/features/participations/components/candidate-status";
import { render, screen, within, waitFor } from "@testing-library/react";
import { WorkflowSteps } from "@/components/ui/workflow-steps";

it.each(["/account", "/dashboard"])("shows public offer summaries and keeps continuation context on %s", async base => {
  const offer = { id: "offer", slug: "auxiliar-ficticio", title: "Auxiliar", company_name: "Empresa Ficticia", location: "Funes", closing_date: "2026-11-30", vacancies: 2, modality: "on_site", categories: [{ name: "Administración" }] };
  mocks.offers.mockResolvedValue({ items: [offer], page: 1, pageSize: 10, total: 1 });
  mocks.selected.mockResolvedValue(offer);
  mocks.participations.mockResolvedValue([{ opening_id: "offer" }]);
  const workspace = { bootstrap: "ready", profile: { status: "active", availability: "available", version: 3 }, cv: {}, consent: { status: "accepted" } } as Parameters<typeof renderCandidateOffersContent>[0]["workspace"];
  render(await renderCandidateOffersContent({ workspace, oferta: offer.slug, offersHref: `${base}?section=ofertas` }));
  const selected = screen.getByRole("region", { name: "Oferta elegida" });
  expect(selected.textContent).toContain("Administración");
  expect(selected.textContent).toContain("Vacantes: 2");
  expect(selected.textContent).toContain("30/11/2026");
  const href = within(selected).getByRole("link", { name: "Ver mis postulaciones" }).getAttribute("href")!;
  expect(new URL(href, "http://fixture.invalid").pathname).toBe(base);
  expect(new URL(href, "http://fixture.invalid").searchParams.get("section")).toBe("postulaciones");
  expect(new URL(href, "http://fixture.invalid").searchParams.get("oferta")).toBe(offer.slug);
});
it("renders only the candidate-safe reception projection in application history", async () => {
  mocks.participations.mockResolvedValue([{ id: "case", display_status: "received", opening_title: "Auxiliar", created_at: "2026-10-01", version: 2 }]);
  render(await renderCandidateParticipationsContent());
  expect(screen.getByRole("list", { name: "Etapas de la postulación" })).toBeTruthy();
  expect(within(screen.getByRole("list", { name: "Etapas de la postulación" })).getByText("Recibida por la Oficina")).toBeTruthy();
  expect(screen.queryByText(/preentrevista|preselección|derivación/i)).toBeNull();
});

it.each(["/account?section=postulaciones&oferta=auxiliar", "/dashboard?section=postulaciones&oferta=auxiliar"])("continues an existing application using %s", href => {
  render(<CandidateApplyForm openingId="offer" candidateVersion={3} disabled={false} alreadyApplied participationsHref={href} />);
  expect(screen.getByRole("link", { name: "Ver mis postulaciones" }).getAttribute("href")).toBe(href);
});
it("continues after successful submission without losing version, refresh or duplicate protection", async () => {
  mocks.apply.mockResolvedValue({ message: "Postulación recibida", success: true });
  render(<CandidateApplyForm openingId="offer" candidateVersion={3} disabled={false} participationsHref="/account?section=postulaciones" />);
  fireEvent.click(screen.getByRole("button", { name: "Postularme" }));
  expect(await screen.findByRole("link", { name: "Ver mis postulaciones" })).toBeTruthy();
  const data = mocks.apply.mock.calls[0]![1] as FormData;
  expect(data.get("candidateVersion")).toBe("3");
  expect(data.get("openingId")).toBe("offer");
  await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
});

it("exposes ordered stages with textual status and one current step", () => {
  render(<WorkflowSteps label="Seguimiento" steps={[
    { label: "Postulación", state: "completed" },
    { label: "Recibida por la Oficina", state: "current" },
    { label: "Resultado", state: "pending" },
  ]} />);
  const list = screen.getByRole("list", { name: "Seguimiento" });
  expect(list.tagName).toBe("OL");
  const items = within(list).getAllByRole("listitem");
  expect(items.map(item => item.textContent)).toEqual([
    "1PostulaciónCompletada", "2Recibida por la OficinaActual", "3ResultadoPendiente",
  ]);
  expect(list.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  expect(items[1]?.getAttribute("aria-current")).toBe("step");
  expect(screen.queryByRole("button")).toBeNull();
});
