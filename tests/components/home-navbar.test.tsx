import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const { route } = vi.hoisted(() => ({ route: { pathname: "/" } }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/features/notifications/components/notification-center", () => ({ NotificationCenter: () => <button aria-label="Notificaciones" /> }));

import { HomeNavbar } from "@/app/(public)/home-navbar";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function scrollToPosition(top: number) {
  act(() => { vi.stubGlobal("scrollY", top); window.dispatchEvent(new Event("scroll")); });
}

function renderDesktopNavbar() {
  vi.useFakeTimers();
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const view = render(<HomeNavbar />);
  return { ...view, header: screen.getByRole("banner", { hidden: true }) };
}

it("holds the navbar for two seconds only after returning to the top", () => {
  const { header } = renderDesktopNavbar();
  expect(header.getAttribute("aria-hidden")).toBe("true");
  scrollToPosition(100);
  scrollToPosition(0);
  act(() => vi.advanceTimersByTime(1999));
  expect(header.getAttribute("aria-hidden")).toBe("false");
  expect(header.hasAttribute("inert")).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(header.getAttribute("aria-hidden")).toBe("true");
  expect(header.hasAttribute("inert")).toBe(true);
});

it("keeps the returned navbar open while hovered until the pointer leaves", () => {
  const { header } = renderDesktopNavbar();
  scrollToPosition(100);
  fireEvent.mouseEnter(header);
  scrollToPosition(0);
  act(() => vi.advanceTimersByTime(4000));
  expect(header.getAttribute("aria-hidden")).toBe("false");
  fireEvent.mouseLeave(header);
  expect(header.getAttribute("aria-hidden")).toBe("true");
});

it("does not shorten the remaining delay when the pointer leaves early", () => {
  const { header } = renderDesktopNavbar();
  scrollToPosition(100);
  scrollToPosition(0);
  fireEvent.mouseEnter(header);
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.mouseLeave(header);
  expect(header.getAttribute("aria-hidden")).toBe("false");
  act(() => vi.advanceTimersByTime(1000));
  expect(header.getAttribute("aria-hidden")).toBe("true");
});

it("restarts the delay on another return and clears it on unmount", () => {
  const { header, unmount } = renderDesktopNavbar();
  scrollToPosition(100);
  scrollToPosition(0);
  act(() => vi.advanceTimersByTime(1000));
  scrollToPosition(100);
  scrollToPosition(0);
  act(() => vi.advanceTimersByTime(1000));
  expect(header.getAttribute("aria-hidden")).toBe("false");
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps keyboard navigation usable after the timer expires", () => {
  const { header } = renderDesktopNavbar();
  scrollToPosition(100);
  const link = header.querySelector("a")!;
  fireEvent.focusIn(link);
  scrollToPosition(0);
  act(() => vi.advanceTimersByTime(3000));
  expect(header.getAttribute("aria-hidden")).toBe("false");
  fireEvent.focusOut(link, { relatedTarget: document.body });
  expect(header.getAttribute("aria-hidden")).toBe("true");
});

it("cancels the desktop delay on a mobile breakpoint change and keeps mobile visible", () => {
  vi.useFakeTimers();
  vi.stubGlobal("scrollY", 0);
  const media = new EventTarget() as EventTarget & { matches: boolean };
  media.matches = false;
  vi.stubGlobal("matchMedia", () => media);
  const schedule = vi.spyOn(globalThis, "setTimeout");
  const cancel = vi.spyOn(globalThis, "clearTimeout");
  render(<HomeNavbar />);
  const header = screen.getByRole("banner", { hidden: true });
  scrollToPosition(100);
  scrollToPosition(0);
  const delayIndex = schedule.mock.calls.findIndex(([, delay]) => delay === 2000);
  expect(delayIndex).toBeGreaterThanOrEqual(0);
  const timer = schedule.mock.results[delayIndex]!.value;
  act(() => { media.matches = true; media.dispatchEvent(new Event("change")); });
  expect(cancel).toHaveBeenCalledWith(timer);
  act(() => vi.advanceTimersByTime(4000));
  expect(header.getAttribute("aria-hidden")).toBe("false");
  act(() => { media.matches = false; media.dispatchEvent(new Event("change")); });
  expect(header.getAttribute("aria-hidden")).toBe("true");
  schedule.mockRestore();
  cancel.mockRestore();
});

it("keeps the account variant visible without a return timer", () => {
  vi.useFakeTimers();
  vi.stubGlobal("scrollY", 0);
  render(<HomeNavbar alwaysVisible />);
  scrollToPosition(100);
  scrollToPosition(0);
  act(() => vi.advanceTimersByTime(4000));
  expect(screen.getByRole("banner").getAttribute("aria-hidden")).toBe("false");
  expect(vi.getTimerCount()).toBe(0);
});

it.each([
  { pathname: "/", active: "Inicio" },
  { pathname: "/ofertas", active: "Ofertas" },
  { pathname: "/ofertas/oferta-ficticia", active: "Ofertas" },
  { pathname: "/dashboard", active: "Mi cuenta" },
])("marks only $active as current at $pathname", ({ pathname, active }) => {
  route.pathname = pathname;
  const { container } = render(<HomeNavbar alwaysVisible={pathname !== "/"} panel={{ href: "/dashboard", label: "Panel de usuario" }} />);
  const links = Array.from(container.querySelectorAll("a[aria-current='page']"));
  expect(links.map(link => link.textContent)).toEqual([active]);
  expect(container.querySelector('a[href="https://funes.gob.ar/"]')?.hasAttribute("aria-current")).toBe(false);
});

it("preserves Home's native anchors without marking the access shortcut as a page", () => {
  route.pathname = "/";
  const { container } = render(<HomeNavbar />);
  expect(container.querySelector('a[href="#contenido"]')?.getAttribute("aria-current")).toBe("page");
  const access = Array.from(container.querySelectorAll("a")).find(link => link.textContent === "Ingresar");
  expect(access?.getAttribute("href")).toBe("#contenido");
  expect(access?.hasAttribute("aria-current")).toBe(false);
  expect(container.querySelector('a[href="/ofertas"]')?.hasAttribute("aria-current")).toBe(false);
});

it("offers anonymous access outside Home without falsely highlighting Home", () => {
  route.pathname = "/account";
  render(<HomeNavbar alwaysVisible />);
  expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/");
  expect(screen.getByRole("link", { name: "Inicio" }).hasAttribute("aria-current")).toBe(false);
  expect(screen.getByRole("link", { name: "Ofertas" }).getAttribute("href")).toBe("/ofertas");
  expect(screen.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/#contenido");
  expect(screen.queryByRole("button", { name: "Notificaciones" })).toBeNull();
});

it.each(["/ofertas", "/ofertas/ejemplo", "/cursos", "/recover", "/terminos"])("keeps anonymous controls consistent at %s", pathname => {
  route.pathname = pathname;
  render(<HomeNavbar alwaysVisible />);
  expect(screen.getAllByRole("link").map(link => link.textContent)).toEqual(["Oficina de EmpleoMunicipalidad de Funes", "Inicio", "Ofertas", "Ingresar"]);
  expect(screen.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/#contenido");
  expect(screen.queryByRole("link", { name: "Mi cuenta" })).toBeNull();
});

it.each(["/dashboard", "/empresa", "/admin"])("keeps authenticated controls in both visibility modes for %s", href => {
  route.pathname = "/ofertas";
  const view = render(<HomeNavbar alwaysVisible panel={{ href, label: "Panel" }} />);
  for (const alwaysVisible of [true, false]) {
    view.rerender(<HomeNavbar alwaysVisible={alwaysVisible} panel={{ href, label: "Panel" }} />);
    expect(view.container.querySelector('a[href="' + href + '"]')?.textContent).toBe("Mi cuenta");
    expect(view.container.querySelector('button[aria-label="Notificaciones"]')).toBeTruthy();
    expect(Array.from(view.container.querySelectorAll("a")).some(link => link.textContent === "Ingresar")).toBe(false);
  }
});
