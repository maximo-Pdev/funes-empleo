import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
const { listPublicOffers } = vi.hoisted(() => ({ listPublicOffers: vi.fn() }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers }));

vi.mock("server-only", () => ({}));
const { readSession } = vi.hoisted(() => ({ readSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: readSession }));

import HomePage from "@/app/(public)/page";
import { HomeNavbar } from "@/app/(public)/home-navbar";

afterEach(() => vi.unstubAllGlobals());

it.each([
  ["candidate", "Ir al panel de usuario"],
  ["company", "Ir al panel de empresa"],
  ["admin", "Ir al panel de administración"],
])("places %s panel access below the session notice instead of the hero", async (role, label) => {
  readSession.mockResolvedValueOnce({ account: { role, status: "active" } });
  render(await HomePage());
  const navigation = screen.getByRole("navigation", { name: "Accesos principales" });
  const href = role === "candidate" ? "/dashboard" : role === "company" ? "/empresa" : "/account";
  expect(navigation.querySelector("a")?.getAttribute("href")).toBe(href);
  expect(navigation.querySelector("a")?.textContent).toBe(label);
  expect(screen.getByRole("region", { name: "Acceso al portal" }).contains(navigation)).toBe(true);
  expect(screen.getByText("Ya tenés la sesión iniciada").compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const intro = screen.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal." }).parentElement!;
  expect(within(intro).queryAllByRole("link")).toHaveLength(0);
  expect(navigation.querySelectorAll("a")).toHaveLength(1);
  expect(within(navigation).queryByRole("link", { name: "Iniciar sesión" })).toBeNull();
  expect(within(navigation).queryByRole("link", { name: "Ofertas" })).toBeNull();
});

it("keeps the municipal introduction free of duplicate account and offers links", async () => {
  render(await HomePage());
  const intro = screen.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal." }).parentElement!;
  expect(within(intro).queryAllByRole("link")).toHaveLength(0);
  expect(screen.getByRole("link", { name: "Ver ofertas disponibles" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Ir al panel de usuario" })).toBeNull();
});

it("keeps the mobile navbar visible and interactive without scrolling", async () => {
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(await HomePage());
  const navbar = screen.getByRole("banner");
  expect(navbar.getAttribute("aria-hidden")).toBe("false");
  expect(navbar.hasAttribute("inert")).toBe(false);
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(navbar.getAttribute("aria-hidden")).toBe("false");
});

it("hides the navbar at the top and reveals it after page scrolling", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("scrollY", 0);
  render(await HomePage());
  const navbar = screen.getByRole("banner", { hidden: true });
  expect(navbar.getAttribute("aria-hidden")).toBe("true");
  act(() => {
    vi.stubGlobal("scrollY", 1);
    window.dispatchEvent(new Event("scroll"));
  });
  expect(navbar.getAttribute("aria-hidden")).toBe("false");
  act(() => {
    vi.stubGlobal("scrollY", 0);
    window.dispatchEvent(new Event("scroll"));
  });
  expect(navbar.getAttribute("aria-hidden")).toBe("false");
  act(() => vi.advanceTimersByTime(2000));
  expect(navbar.getAttribute("aria-hidden")).toBe("true");
  vi.useRealTimers();
});

it("renders the offers preview below the opening viewport", async () => {
  render(await HomePage());
  const information = screen.getByRole("region", { name: "Ofertas disponibles" });
  expect(information.id).toBe("ofertas-disponibles");
  expect(information.getAttribute("tabindex")).toBe("-1");
  expect(within(information).getByRole("heading", { name: "Ofertas disponibles" })).toBeTruthy();
  expect(within(information).getByText("Explorá una selección de las búsquedas vigentes aprobadas por la Oficina de Empleo.")).toBeTruthy();
  expect(within(information).getByRole("link", { name: "Ver todas las ofertas" }).getAttribute("href")).toBe("/ofertas");
});

it("lists fetched offers as preview cards in the carousel", async () => {
  listPublicOffers.mockResolvedValue({
    total: 3, page: 1, pageSize: 12,
    items: [
      { id: "1", slug: "operario", company_name: "Metalúrgica Funes", title: "Operario de planta", tasks: "", requirements: "", vacancies: 2, location: "Funes", modality: "onsite", schedule: "Lun a Vie", contract_type: "fixed_term", closing_date: "2026-12-31", salary: null, benefits: null, categories: [{ id: "c1", name: "Producción" }] },
      { id: "2", slug: "admin", company_name: "Comercio SA", title: "Administrativo", tasks: "", requirements: "", vacancies: 1, location: "Funes", modality: "onsite", schedule: "", contract_type: "permanent", closing_date: "2026-11-30", salary: null, benefits: null, categories: [] },
      { id: "3", slug: "ventas", company_name: "Tienda", title: "Vendedor", tasks: "", requirements: "", vacancies: 3, location: "Rosario", modality: "onsite", schedule: "", contract_type: "fixed_term", closing_date: "2026-10-31", salary: null, benefits: null, categories: [] },
    ],
  });
  render(await HomePage());
  const information = screen.getByRole("region", { name: "Ofertas disponibles" });
  expect(within(information).getByRole("link", { name: "Operario de planta" }).getAttribute("href")).toBe("/ofertas/operario");
  expect(within(information).getByText("Metalúrgica Funes")).toBeTruthy();
  expect(within(information).getAllByText(/Presencial/)).toHaveLength(3);
  expect(within(information).getByText(/2 vacantes/)).toBeTruthy();
});

it("links the floating offers action to the lower information viewport", async () => {
  render(await HomePage());
  const action = screen.getByRole("link", { name: "Ver ofertas disponibles" });
  const target = screen.getByRole("region", { name: "Ofertas disponibles" });
  expect(action.getAttribute("href")).toBe(`#${target.id}`);
  expect(target.id).toBe("ofertas-disponibles");
  expect(target.getAttribute("tabindex")).toBe("-1");
});

it("replaces the photo slideshow with a decorative ribbons canvas", async () => {
  const { container } = render(await HomePage());
  expect(container.querySelectorAll("[data-hero-slide]")).toHaveLength(0);
  const canvas = container.querySelector("canvas[data-ribbons]");
  expect(canvas).toBeTruthy();
  expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  expect(screen.queryByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ })).toBeNull();
});

it("restores the municipal introduction and complete intermediary information", async () => {
  render(await HomePage());
  expect(screen.queryByText("Tu próximo trabajo empieza acá.")).toBeNull();
  const intro = screen.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal." }).parentElement!;
  for (const text of [
    "Ingresá para continuar con tu perfil y gestionar tus oportunidades desde un mismo lugar.",
    "Postulantes", "Completá tu perfil y postulate a ofertas vigentes.",
    "Empresas", "Gestioná tus ofertas y los perfiles derivados por la Oficina.",
    "La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.",
  ]) expect(within(intro).getByText(text)).toBeTruthy();
});

it("renders the process, role, FAQ and closing sections below the offers", async () => {
  render(await HomePage());
  expect(screen.getByRole("heading", { name: "Simple para usar, cuidadoso con los datos." })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Cada perfil entra por el camino correcto" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Lo que más nos preguntan" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "¿Listo para dar el siguiente paso?" })).toBeTruthy();
  for (const step of [
    "La empresa envía una búsqueda para revisión municipal.",
    "La Oficina publica la oferta y evalúa postulantes.",
    "Solo los perfiles derivados se comparten con la empresa.",
  ]) expect(screen.getByText(step)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Crear cuenta de postulante" }).getAttribute("href")).toBe("/registro/candidato");
  const roles = screen.getByRole("region", { name: "Cada perfil entra por el camino correcto" });
  expect(within(roles).getAllByRole("heading", { level: 3 }).map(heading => heading.textContent)).toEqual(["Postulantes", "Empresas"]);
  expect(within(roles).queryByRole("link", { name: "Ingresar al panel" })).toBeNull();
  expect(screen.getByRole("link", { name: "Registrarme como postulante" }).getAttribute("href")).toBe("/registro/candidato");
  expect(screen.getByText("¿Necesito una cuenta para ver las ofertas?")).toBeTruthy();
  expect(screen.getByText("¿Quién puede ver mi CV?")).toBeTruthy();
});

it("uses the supplied vector logo and marks the homepage navbar variant", async () => {
  render(await HomePage());
  const navbar = screen.getByRole("banner", { hidden: true });
  expect(navbar.getAttribute("data-home")).toBe("true");
  expect(navbar.querySelector("img")?.getAttribute("src")).toBe("/brand/funes-navbar-emblem.svg");
  const navigation = screen.getByRole("navigation", { name: "Navegación principal", hidden: true });
  const links = Array.from(navigation.querySelectorAll("a"));
  expect(links.find(link => link.textContent === "Inicio")?.getAttribute("href")).toBe("#contenido");
  expect(links.find(link => link.textContent === "Ofertas")?.getAttribute("href")).toBe("/ofertas");
});

it("preserves account navbar navigation back to the homepage", async () => {
  render(<HomeNavbar alwaysVisible />);
  expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/");
  expect(screen.getByRole("link", { name: "Ofertas" }).getAttribute("href")).toBe("/ofertas");
});

it("shows the user panel link in the navbar only with an active session", async () => {
  readSession.mockResolvedValueOnce({ account: { role: "candidate", status: "active" } });
  const view = render(await HomePage());
  const navigation = within(screen.getByRole("navigation", { name: "Navegación principal", hidden: true }));
  expect(navigation.getByRole("link", { name: "Mi cuenta", hidden: true }).getAttribute("href")).toBe("/dashboard");
  view.unmount();
  render(await HomePage());
  const anonymous = within(screen.getByRole("navigation", { name: "Navegación principal", hidden: true }));
  expect(anonymous.queryByRole("link", { name: "Mi cuenta", hidden: true })).toBeNull();
  expect(anonymous.getByRole("link", { name: "Ingresar", hidden: true }).getAttribute("href")).toBe("#contenido");
});

it("moves the municipal identity into the navbar without changing its official-site exit", async () => {
  render(await HomePage());
  const navbar = screen.getByRole("navigation", { name: "Navegación principal", hidden: true });
  expect(within(navbar).getByText("Oficina de Empleo")).toBeTruthy();
  expect(navbar.querySelector("a")?.getAttribute("href")).toBe("https://funes.gob.ar/");
  const intro = screen.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal." }).parentElement!;
  expect(intro.querySelector("img")).toBeNull();
  expect(within(intro).queryByText("Oficina de Empleo")).toBeNull();
  expect(screen.getByRole("region", { name: "Acceso al portal" }).id).toBe("acceso");
});

it("preserves a unique focusable skip-link target on the redesigned home", async () => {
  const { container } = render(await HomePage());
  const main = screen.getByRole("main");
  expect(main.id).toBe("contenido");
  expect(main.getAttribute("tabindex")).toBe("-1");
  expect(container.querySelectorAll("#contenido")).toHaveLength(1);
});

it("replaces the previous offer preview and navigation with the access panel", async () => {
  render(await HomePage());
  expect(screen.getByRole("region", { name: "Acceso al portal" })).toBeTruthy();
  const navbar = screen.getByRole("navigation", { name: "Navegación principal", hidden: true });
  expect(navbar.querySelector("a")?.getAttribute("href")).toBe("https://funes.gob.ar/");
  expect(navbar.querySelector("img")?.getAttribute("alt")).toBe("Municipalidad de Funes");
  expect(screen.getByRole("banner", { hidden: true }).contains(navbar)).toBe(true);
  expect(screen.getByRole("main").contains(navbar)).toBe(false);
  expect(screen.queryByRole("contentinfo")).toBeNull();
  expect(screen.queryByRole("region", { name: "Búsquedas aprobadas por la Oficina de Empleo" })).toBeNull();
  expect(listPublicOffers).toHaveBeenCalled();
});
