import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
const { listPublicOffers } = vi.hoisted(() => ({ listPublicOffers: vi.fn() }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers }));

import HomePage from "@/app/(public)/page";
import { HomeNavbar } from "@/app/(public)/home-navbar";

afterEach(() => vi.unstubAllGlobals());

it("keeps the mobile navbar visible and interactive without scrolling", () => {
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(<HomePage />);
  const navbar = screen.getByRole("banner");
  expect(navbar.getAttribute("aria-hidden")).toBe("false");
  expect(navbar.hasAttribute("inert")).toBe(false);
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(navbar.getAttribute("aria-hidden")).toBe("false");
});

it("hides the navbar at the top and reveals it after page scrolling", () => {
  vi.stubGlobal("scrollY", 0);
  render(<HomePage />);
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
  expect(navbar.getAttribute("aria-hidden")).toBe("true");
});

it("keeps an empty information section after the opening viewport", () => {
  render(<HomePage />);
  const information = screen.getByRole("region", { name: "Información del portal" });
  expect(information.textContent).toBe("");
  expect(information.childElementCount).toBe(0);
  expect(screen.getByRole("main").lastElementChild).toBe(information);
});

it("links the floating offers action to the lower information viewport", () => {
  render(<HomePage />);
  const action = screen.getByRole("link", { name: "Ver ofertas disponibles" });
  const target = screen.getByRole("region", { name: "Información del portal" });
  expect(action.getAttribute("href")).toBe(`#${target.id}`);
  expect(target.id).toBe("ofertas-disponibles");
  expect(target.getAttribute("tabindex")).toBe("-1");
});

it("replaces the photo slideshow with a decorative ribbons canvas", () => {
  const { container } = render(<HomePage />);
  expect(container.querySelectorAll("[data-hero-slide]")).toHaveLength(0);
  const canvas = container.querySelector("canvas[data-ribbons]");
  expect(canvas).toBeTruthy();
  expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  expect(screen.queryByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ })).toBeNull();
});

it("restores the municipal introduction and complete intermediary information", () => {
  render(<HomePage />);
  expect(screen.queryByText("Tu próximo trabajo empieza acá.")).toBeNull();
  expect(screen.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal." })).toBeTruthy();
  for (const text of [
    "Oficina de Empleo", "Municipalidad de Funes",
    "Ingresá para continuar con tu perfil y gestionar tus oportunidades desde un mismo lugar.",
    "Postulantes", "Completá tu perfil y postulate a ofertas vigentes.",
    "Empresas", "Gestioná tus ofertas y los perfiles derivados por la Oficina.",
    "La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.",
  ]) expect(screen.getByText(text)).toBeTruthy();
});

it("uses the supplied vector logo and marks the homepage navbar variant", () => {
  render(<HomePage />);
  const navbar = screen.getByRole("banner", { hidden: true });
  expect(navbar.getAttribute("data-home")).toBe("true");
  expect(navbar.querySelector("img")?.getAttribute("src")).toBe("/brand/funes-navbar-emblem.svg");
  const navigation = screen.getByRole("navigation", { hidden: true });
  const links = Array.from(navigation.querySelectorAll("a"));
  expect(links.find(link => link.textContent === "Inicio")?.getAttribute("href")).toBe("#contenido");
  expect(links.find(link => link.textContent === "Ofertas")?.getAttribute("href")).toBe("/ofertas");
});

it("preserves account navbar navigation back to the homepage", () => {
  render(<HomeNavbar alwaysVisible />);
  expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/");
  expect(screen.getByRole("link", { name: "Ofertas" }).getAttribute("href")).toBe("/ofertas");
});

it("preserves a unique focusable skip-link target on the redesigned home", () => {
  const { container } = render(<HomePage />);
  const main = screen.getByRole("main");
  expect(main.id).toBe("contenido");
  expect(main.getAttribute("tabindex")).toBe("-1");
  expect(container.querySelectorAll("#contenido")).toHaveLength(1);
});

it("replaces the previous offer preview and navigation with the access panel", () => {
  render(<HomePage />);
  expect(screen.getByRole("region", { name: "Acceso al portal" })).toBeTruthy();
  const navbar = screen.getByRole("navigation", { hidden: true });
  expect(navbar.querySelector("a")?.getAttribute("href")).toBe("https://funes.gob.ar/");
  expect(navbar.querySelector("img")?.getAttribute("alt")).toBe("Municipalidad de Funes");
  expect(screen.getByRole("banner", { hidden: true }).contains(navbar)).toBe(true);
  expect(screen.getByRole("main").contains(navbar)).toBe(false);
  expect(screen.queryByRole("contentinfo")).toBeNull();
  expect(screen.queryByRole("region", { name: "Búsquedas aprobadas por la Oficina de Empleo" })).toBeNull();
  expect(listPublicOffers).not.toHaveBeenCalled();
});
