import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { PublicOffer } from "@/features/openings/public-service";

const mocks = vi.hoisted(() => ({ session: vi.fn(), list: vi.fn(), offer: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/features/participations/candidate-service", () => ({ listMyParticipations: mocks.list }));
vi.mock("@/features/openings/public-service", () => ({ getPublicOffer: mocks.offer }));
vi.mock("next/navigation", () => ({ usePathname: () => "/ofertas/ejemplo", notFound: vi.fn() }));
vi.mock("@/features/notifications/components/notification-center", () => ({ NotificationCenter: () => <button>Notificaciones</button> }));

import Page from "@/app/(public)/ofertas/[openingId]/page";

const offer: PublicOffer = {
  id: "0a000000-0000-4000-8000-000000000001", slug: "oferta-ficticia-a1b2c3d4e5f6",
  title: "Oferta ficticia", company_name: "Empresa ficticia", location: "Funes", closing_date: "2099-11-01",
  tasks: "Tareas ficticias", requirements: "Experiencia ficticia", vacancies: 1,
  modality: "on_site", schedule: "Jornada completa", contract_type: "Permanente", salary: null, benefits: null, categories: [],
};
const participation = (display_status: string, opening_id = offer.id) => ({ id: `attempt-${display_status}`, opening_id, display_status });
const detail = () => Page({ params: Promise.resolve({ openingId: offer.slug }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ account: { role: "candidate", status: "active" } });
  mocks.offer.mockResolvedValue(offer);
  mocks.list.mockResolvedValue([]);
});

it("mantiene el enlace a la oferta seleccionada si no hay participación propia", async () => {
  render(await detail());
  expect(screen.getByRole("link", { name: "Postularme con mi cuenta" }).getAttribute("href"))
    .toBe(`/dashboard?section=ofertas&oferta=${offer.slug}`);
  expect(mocks.list).toHaveBeenCalledOnce();
});

it("avisa el retiro anterior y permite continuar a un nuevo intento", async () => {
  mocks.list.mockResolvedValue([participation("withdrawn")]);
  render(await detail());
  expect(screen.getByText(/Tu postulación anterior fue retirada/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Volver a postularme" }).getAttribute("href"))
    .toBe(`/dashboard?section=ofertas&oferta=${offer.slug}`);
  expect(screen.queryByRole("link", { name: "Postularme con mi cuenta" })).toBeNull();
});

it.each(["received", "hired", "not_selected", "cancelled", "no_company_response"])("un caso %s prevalece sobre el retiro anterior", async status => {
  mocks.list.mockResolvedValue([participation("withdrawn"), participation(status)]);
  render(await detail());
  expect(screen.getByText("Ya tenés una participación registrada en esta oferta.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver mi postulación" }).getAttribute("href"))
    .toBe(`/dashboard?section=postulaciones&oferta=${offer.slug}`);
  expect(screen.queryByRole("link", { name: /Postularme con mi cuenta|Volver a postularme/ })).toBeNull();
});

it("otra oferta no bloquea ni genera un aviso de retiro", async () => {
  mocks.list.mockResolvedValue([participation("received", "other"), participation("withdrawn", "other")]);
  render(await detail());
  expect(screen.getByRole("link", { name: "Postularme con mi cuenta" })).toBeTruthy();
  expect(screen.queryByText(/Tu postulación anterior fue retirada/)).toBeNull();
});

it.each(["anonymous", "company", "admin", "suspended"])("no consulta historial privado para %s", async role => {
  mocks.session.mockResolvedValue(role === "anonymous" ? null : { account: {
    role: role === "suspended" ? "candidate" : role, status: role === "suspended" ? "suspended" : "active",
  } });
  render(await detail());
  expect(mocks.list).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Postularme con mi cuenta" }).getAttribute("href"))
    .toBe(`/dashboard?section=ofertas&oferta=${offer.slug}`);
});

it("un fallo privado no afirma que se puede enviar ni expone el error técnico", async () => {
  mocks.list.mockRejectedValue(new Error("detalle interno ficticio"));
  render(await detail());
  expect(screen.getByText(/No pudimos comprobar tu postulación/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Revisar mis postulaciones" }).getAttribute("href"))
    .toBe(`/dashboard?section=postulaciones&oferta=${offer.slug}`);
  expect(screen.queryByText("detalle interno ficticio")).toBeNull();
  expect(screen.queryByRole("link", { name: "Postularme con mi cuenta" })).toBeNull();
});
