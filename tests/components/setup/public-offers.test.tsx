import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { PublicOffer } from "@/features/openings/public-service";
import { AppError } from "@/lib/errors/public-error";

const { listPublicOffers, listPublicOfferFilters, getPublicOffer, notFound, readAccountSession } = vi.hoisted(() => ({
  listPublicOffers: vi.fn<typeof import("@/features/openings/public-service").listPublicOffers>(),
  listPublicOfferFilters: vi.fn(),
  getPublicOffer: vi.fn<typeof import("@/features/openings/public-service").getPublicOffer>(),
  notFound: vi.fn<() => never>(),
  readAccountSession: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers, getPublicOffer, listPublicOfferFilters }));
vi.mock("next/navigation", () => ({ notFound }));

import PublicOffersPage from "@/app/(public)/ofertas/page";
import PublicOfferDetailPage from "@/app/(public)/ofertas/[openingId]/page";

// Async page/component contracts only: these mocks do not verify RPC, RLS or live data.
const offer: PublicOffer = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "titulo-original-a1b2c3d4e5f6",
  title: "Auxiliar ficticio", company_name: "Empresa ficticia", tasks: "Organizar depósito ficticio.",
  requirements: "Experiencia ficticia.", vacancies: 2, location: "Funes", modality: "onsite",
  schedule: "Lunes a viernes", contract_type: "fixed_term", closing_date: "2099-12-31",
  salary: null, benefits: null,
  categories: [{ id: "00000000-0000-4000-8000-000000000010", name: "Categoría ficticia" }],
};
const listPage = (page?: string) => PublicOffersPage({ searchParams: Promise.resolve({ page }) });
const detailPage = () => PublicOfferDetailPage({ params: Promise.resolve({ openingId: offer.slug }) });

beforeEach(() => {
  vi.resetAllMocks();
  readAccountSession.mockResolvedValue(null);
  listPublicOfferFilters.mockResolvedValue({ categories: [], localities: [], modalities: [] });
});

it.each([
  ["candidate", "/dashboard?section=perfil", "Mi perfil"], ["company", "/empresa/perfil", "Mi perfil"], ["admin", "/account", "Cuenta"],
])("mantiene acceso de %s en listado y detalle públicos", async (role, href, label) => {
  readAccountSession.mockResolvedValue({ account: { role, status: "active" } });
  listPublicOffers.mockResolvedValue({ total: 1, page: 1, pageSize: 10, items: [offer] });
  getPublicOffer.mockResolvedValue(offer);
  for (const Page of [listPage, detailPage]) {
    const view = render(await Page());
    const navigation = screen.getByRole("navigation", { name: "Accesos principales" });
    expect(within(navigation).getByRole("link", { name: label }).getAttribute("href")).toBe(href);
    expect(within(navigation).queryByRole("link", { name: "Iniciar sesión" })).toBeNull();
    view.unmount();
  }
});

it("renderiza el listado y enlaces de paginación usando la página solicitada", async () => {
  listPublicOffers.mockResolvedValue({ total: 5, page: 2, pageSize: 2, items: [offer] });
  const { container } = render(await listPage("2"));
  expect(screen.getByText("Funes · Presencial")).toBeTruthy();
  const date = container.querySelector("time");
  expect(date?.textContent).toBe("31/12/2099");
  expect(date?.getAttribute("datetime")).toBe("2099-12-31");
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ page: 2, q: "", rubro: "", localidad: "", modalidad: "" }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Ofertas laborales vigentes");
  expect(screen.getByRole("link", { name: offer.title }).getAttribute("href")).toBe(`/ofertas/${offer.slug}`);
  const pagination = screen.getByRole("navigation", { name: "Páginas de ofertas" });
  expect(within(pagination).getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe("/ofertas?page=1");
  expect(within(pagination).getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/ofertas?page=3");
});

it("distingue un listado vacío sin inventar ofertas ni paginación", async () => {
  listPublicOffers.mockResolvedValue({ total: 0, page: 1, pageSize: 10, items: [] });
  render(await listPage());
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ page: 1 }));
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

it("propaga errores técnicos del listado al boundary de la ruta", async () => {
  const error = new AppError("INTERNAL_ERROR");
  listPublicOffers.mockRejectedValue(error);
  await expect(listPage()).rejects.toBe(error);
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ page: 1 }));
});

it("entrada inválida muestra mensaje sin consultar ni ampliar resultados", async () => {
  render(await listPage("inválida"));
  expect(screen.getByRole("alert").textContent).toContain("Revisá los filtros");
  expect(listPublicOffers).not.toHaveBeenCalled();
});

it("conserva filtros y opciones, pagina sin UUID y reinicia página al buscar", async () => {
  listPublicOfferFilters.mockResolvedValue({ categories: [{ value: "ADMIN", label: "Administración" }], localities: [{ value: "funes", label: "Funes" }], modalities: [{ value: "onsite", label: "onsite" }] });
  listPublicOffers.mockResolvedValue({ total: 25, page: 2, pageSize: 10, items: [offer] });
  render(await PublicOffersPage({ searchParams: Promise.resolve({ page: "2", q: "auxiliar", rubro: "ADMIN", localidad: "Funes", modalidad: "onsite" }) }));
  expect(screen.getByLabelText("Buscar por texto")).toHaveProperty("value", "auxiliar");
  expect(screen.getByLabelText("Rubro")).toHaveProperty("value", "ADMIN");
  expect(screen.getByLabelText("Localidad")).toHaveProperty("value", "funes");
  expect(screen.getByLabelText("Modalidad")).toHaveProperty("value", "onsite");
  const form = screen.getByRole("form", { name: "Buscar ofertas laborales" });
  expect(form.getAttribute("method")).toBe("get");
  expect(form.querySelector('[name="page"]')).toBeNull();
  const pagination = screen.getByRole("navigation", { name: "Páginas de ofertas" });
  expect(within(pagination).getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/ofertas?q=auxiliar&rubro=ADMIN&localidad=funes&modalidad=onsite&page=3");
  expect(screen.getByRole("link", { name: "Limpiar filtros" }).getAttribute("href")).toBe("/ofertas");
});

it("conserva rubro retirado como opción no disponible sin ignorar filtro", async () => {
  listPublicOffers.mockResolvedValue({ total: 0, page: 1, pageSize: 10, items: [] });
  render(await PublicOffersPage({ searchParams: Promise.resolve({ rubro: "RETIRADO" }) }));
  expect(screen.getByLabelText("Rubro")).toHaveProperty("value", "RETIRADO");
  expect(screen.getByText("No encontramos ofertas con esos filtros.")).toBeTruthy();
  expect(listPublicOffers).toHaveBeenCalledWith(expect.objectContaining({ rubro: "RETIRADO" }));
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
  expect(getPublicOffer).toHaveBeenCalledExactlyOnceWith(offer.slug);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(offer.title);
  expect(screen.getByText(offer.tasks)).toBeTruthy();
  expect(screen.getByText(offer.requirements)).toBeTruthy();
  expect(Boolean(screen.queryByRole("heading", { name: "Salario" }))).toBe(optional);
  expect(Boolean(screen.queryByRole("heading", { name: "Beneficios" }))).toBe(optional);
  expect(screen.getByRole("link", { name: "Postularme con mi cuenta" }).getAttribute("href")).toBe(`/dashboard?section=ofertas&oferta=${offer.slug}`);
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
