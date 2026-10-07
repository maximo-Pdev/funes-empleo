import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { PublicOffer } from "@/features/openings/public-service";
import { AppError } from "@/lib/errors/public-error";

const { listPublicOffers, getPublicOffer, notFound } = vi.hoisted(() => ({
  listPublicOffers: vi.fn<typeof import("@/features/openings/public-service").listPublicOffers>(),
  getPublicOffer: vi.fn<typeof import("@/features/openings/public-service").getPublicOffer>(),
  notFound: vi.fn<() => never>(),
}));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers, getPublicOffer }));
vi.mock("next/navigation", () => ({ notFound }));

import PublicOffersPage from "@/app/(public)/ofertas/page";
import PublicOfferDetailPage from "@/app/(public)/ofertas/[openingId]/page";

// Async page/component contracts only: these mocks do not verify RPC, RLS or live data.
const offer: PublicOffer = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Auxiliar ficticio", company_name: "Empresa ficticia", tasks: "Organizar depósito ficticio.",
  requirements: "Experiencia ficticia.", vacancies: 2, location: "Funes", modality: "onsite",
  schedule: "Lunes a viernes", contract_type: "fixed_term", closing_date: "2099-12-31",
  salary: null, benefits: null,
  categories: [{ id: "00000000-0000-4000-8000-000000000010", name: "Categoría ficticia" }],
};
const listPage = (page?: string) => PublicOffersPage({ searchParams: Promise.resolve({ page }) });
const detailPage = () => PublicOfferDetailPage({ params: Promise.resolve({ openingId: offer.id }) });

beforeEach(() => {
  vi.resetAllMocks();
});

it("renderiza el listado y enlaces de paginación usando la página solicitada", async () => {
  listPublicOffers.mockResolvedValue({ total: 5, page: 2, pageSize: 2, items: [offer] });
  const { container } = render(await listPage("2"));
  expect(screen.getByText("Funes · Presencial")).toBeTruthy();
  const date = container.querySelector("time");
  expect(date?.textContent).toBe("31/12/2099");
  expect(date?.getAttribute("datetime")).toBe("2099-12-31");
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith({ page: "2" });
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Ofertas laborales vigentes");
  expect(screen.getByRole("link", { name: offer.title }).getAttribute("href")).toBe(`/ofertas/${offer.id}`);
  const pagination = screen.getByRole("navigation", { name: "Páginas de ofertas" });
  expect(within(pagination).getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe("/ofertas?page=1");
  expect(within(pagination).getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/ofertas?page=3");
});

it("distingue un listado vacío sin inventar ofertas ni paginación", async () => {
  listPublicOffers.mockResolvedValue({ total: 0, page: 1, pageSize: 10, items: [] });
  render(await listPage());
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith({ page: 1 });
  expect(screen.getByText("No hay ofertas vigentes en esta página.")).toBeTruthy();
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.queryByRole("navigation", { name: "Páginas de ofertas" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Ver ofertas disponibles" })).toBeNull();
});

it("ofrece volver al inicio del listado ante una página fuera de rango", async () => {
  listPublicOffers.mockResolvedValue({ total: 2, page: 9, pageSize: 10, items: [] });
  render(await listPage("9"));
  expect(screen.getByRole("link", { name: "Ver ofertas disponibles" }).getAttribute("href")).toBe("/ofertas");
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.queryByRole("link", { name: "Siguiente" })).toBeNull();
});

it("propaga errores del listado, incluida validación, al boundary de la ruta", async () => {
  const error = new AppError("VALIDATION_ERROR");
  listPublicOffers.mockRejectedValue(error);
  await expect(listPage("inválida")).rejects.toBe(error);
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith({ page: "inválida" });
});

it.each([false, true])("renderiza detalle y campos opcionales solo si existen (%s)", async (optional) => {
  getPublicOffer.mockResolvedValue({ ...offer, salary: optional ? "Salario ficticio" : null, benefits: optional ? "Beneficio ficticio" : null });
  const { container } = render(await detailPage());
  expect(screen.getByText("Presencial")).toBeTruthy();
  expect(screen.getByText("Plazo fijo")).toBeTruthy();
  const dates = container.querySelectorAll("time");
  expect(dates).toHaveLength(2);
  for (const date of dates) {
    expect(date.textContent).toBe("31/12/2099");
    expect(date.getAttribute("datetime")).toBe("2099-12-31");
  }
  expect(getPublicOffer).toHaveBeenCalledExactlyOnceWith(offer.id);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(offer.title);
  expect(screen.getByText(offer.tasks)).toBeTruthy();
  expect(screen.getByText(offer.requirements)).toBeTruthy();
  expect(Boolean(screen.queryByRole("heading", { name: "Salario" }))).toBe(optional);
  expect(Boolean(screen.queryByRole("heading", { name: "Beneficios" }))).toBe(optional);
  expect(screen.getByRole("link", { name: "Postularme con mi cuenta" }).getAttribute("href")).toBe(`/candidato/ofertas?oferta=${offer.id}`);
});

it("traduce solo NOT_FOUND a navegación notFound", async () => {
  const navigationSignal = new Error("Señal ficticia de navegación");
  notFound.mockImplementation(() => { throw navigationSignal; });
  getPublicOffer.mockRejectedValue(new AppError("NOT_FOUND"));
  await expect(detailPage()).rejects.toBe(navigationSignal);
  expect(notFound).toHaveBeenCalledExactlyOnceWith();
});

it("propaga errores técnicos del detalle sin convertirlos en oferta ausente", async () => {
  const error = new Error("Fallo ficticio de servicio");
  getPublicOffer.mockRejectedValue(error);
  await expect(detailPage()).rejects.toBe(error);
  expect(notFound).not.toHaveBeenCalled();
});
