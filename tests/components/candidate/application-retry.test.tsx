import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), offers: vi.fn(), selected: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/participations/candidate-service", () => ({ listMyParticipations: mocks.list }));
vi.mock("@/features/participations/candidate-actions", () => ({ withdrawParticipationAction: vi.fn() }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: mocks.offers, getPublicOffer: mocks.selected }));
import { renderCandidateOffersContent } from "@/app/(candidate)/candidato/_components/offers-content";
import type { PublicOffer } from "@/features/openings/public-service";

const offer: PublicOffer = {
  id: "0a000000-0000-4000-8000-000000000001", slug: "oferta-ficticia-a1b2c3d4e5f6",
  title: "Oferta ficticia", company_name: "Empresa ficticia", location: "Funes", closing_date: "2026-11-01",
  tasks: "Tareas ficticias de administración", requirements: "Experiencia ficticia", vacancies: 2,
  modality: "on_site", schedule: "Jornada completa", contract_type: "Permanente", salary: null, benefits: null,
  categories: [{ id: "0a000000-0000-4000-8000-000000000002", name: "Administración" }],
};
const workspace = { bootstrap: "ready", profile: { status: "active", availability: "available", version: 3 }, cv: { original_name_safe: "general.pdf" }, consent: { status: "accepted" } };
const contexts = [
  { base: "/account", selected: false }, { base: "/account", selected: true },
  { base: "/dashboard", selected: false }, { base: "/dashboard", selected: true },
];
const content = ({ base, selected }: typeof contexts[number]) => renderCandidateOffersContent({
  workspace: workspace as Parameters<typeof renderCandidateOffersContent>[0]["workspace"],
  offersHref: `${base}?section=ofertas&page=2`, oferta: selected ? offer.slug : undefined,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.offers.mockResolvedValue({ items: [offer], total: 1, page: 1, pageSize: 10 });
  mocks.selected.mockResolvedValue(offer);
  mocks.list.mockResolvedValue([]);
});

it.each(contexts)("permite nuevos intentos y conserva continuación en $base, elegida=$selected", async context => {
  const request = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    new Response(JSON.stringify({ success: true }), { status: 200 }));
  try {
    const view = render(await content(context));
    expect(screen.getByText(/Cierre: 01\/11\/2026/)).toBeTruthy();
    expect(screen.getByText(/Modalidad:.*Vacantes: 2/)).toBeTruthy();
    const categories = screen.getByText("Administración").closest("p");
    expect(categories?.textContent).toBe("Rubros: Administración");
    expect(categories?.querySelector("svg.lucide-clipboard-list")?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText(/se usará tu CV del perfil: general.pdf/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Oferta elegida" }) !== null).toBe(context.selected);
    const assertContinuation = () => {
      const href = screen.getByRole("link", { name: "Ver mis postulaciones" }).getAttribute("href");
      expect(href).toBe(`${context.base}?section=postulaciones&oferta=${offer.slug}`);
    };
    const submit = async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Postularme" }).closest("form")!);
      expect(await screen.findByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
      assertContinuation();
    };
    await submit();
    expect(request).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0]!;
    expect(url).toBe("/api/candidate/applications");
    expect(options?.method).toBe("POST");
    expect((options?.body as FormData).get("openingId")).toBe(offer.id);
    expect((options?.body as FormData).get("candidateVersion")).toBe("3");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());

    mocks.list.mockResolvedValue([{ id: "attempt-1", opening_id: offer.id, display_status: "received" }]);
    view.rerender(await content(context));
    expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
    assertContinuation();
    mocks.list.mockResolvedValue([{ id: "attempt-1", opening_id: offer.id, display_status: "withdrawn" }]);
    view.rerender(await content(context));
    expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", false);
    expect(screen.queryByText("Postulación recibida por la Oficina de Empleo.")).toBeNull();
    expect(screen.getByLabelText("CV específico para esta oferta (opcional)")).toHaveProperty("disabled", false);
    await submit();

    // A new withdrawn attempt must reset success even when the visible status is unchanged.
    mocks.list.mockResolvedValue([
      { id: "attempt-1", opening_id: offer.id, display_status: "withdrawn" },
      { id: "attempt-2", opening_id: offer.id, display_status: "withdrawn" },
    ]);
    view.rerender(await content(context));
    expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", false);
    expect(screen.queryByRole("link", { name: "Ver mis postulaciones" })).toBeNull();
  } finally { request.mockRestore(); }
});
it.each(["received", "hired", "not_selected", "cancelled", "no_company_response"])("bloquea un caso %s aunque existan retiros", async display_status => {
  mocks.list.mockResolvedValue([{ id: "old", opening_id: offer.id, display_status: "withdrawn" }, { id: "new", opening_id: offer.id, display_status }]);
  render(await content(contexts[0]!));
  expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
});
