import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { HomeOffersCarousel } from "@/app/(public)/home-offers-carousel";
import type { PublicOffer } from "@/features/openings/public-service";
const offers: PublicOffer[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index), slug: `oferta-${index}`, company_name: "Empresa ficticia", title: `Oferta reciente ${index + 1}`,
  tasks: "", requirements: "", vacancies: 1, location: "Funes", modality: "onsite", schedule: "", contract_type: "permanent",
  closing_date: "2027-01-01", salary: null, benefits: null, categories: [],
}));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
it("muestra vecinos circulares en ambos extremos y las flechas recorren el ciclo", () => {
  const view = render(<HomeOffersCarousel offers={offers} />);
  const cards = view.container.querySelectorAll<HTMLElement>('[data-slot="coverflow-card"]');
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("0");
  expect(cards[9]!.style.getPropertyValue("--r")).toBe("1");
  expect(cards[8]!.style.getPropertyValue("--r")).toBe("2");
  expect(cards[1]!.style.getPropertyValue("--r")).toBe("-1");
  expect(cards[5]!.getAttribute("aria-hidden")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  expect(cards[9]!.style.getPropertyValue("--r")).toBe("0");
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("-1");
  expect(cards[1]!.style.getPropertyValue("--r")).toBe("-2");
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("0");
  for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("0");
  expect(screen.getAllByRole("button").every(button => !(button as HTMLButtonElement).disabled)).toBe(true);
});
it("una sola oferta no ofrece navegación hacia ofertas inexistentes", () => {
  render(<HomeOffersCarousel offers={offers.slice(0, 1)} />);
  for (const label of ["Anterior", "Siguiente"]) expect(screen.getByRole("button", { name: label })).toHaveProperty("disabled", true);
  expect(screen.queryByRole("button", { name: /carrusel/ })).toBeNull();
});
it.each([2, 3, 4, 5])("recorre %i ofertas sin duplicar tarjetas ni perder el centro", count => {
  const view = render(<HomeOffersCarousel offers={offers.slice(0, count)} />);
  const cards = view.container.querySelectorAll<HTMLElement>('[data-slot="coverflow-card"]');
  expect(cards).toHaveLength(count);
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  expect(cards[count - 1]!.style.getPropertyValue("--r")).toBe("0");
  expect(Array.from(cards).filter(card => card.style.getPropertyValue("--r") === "0")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("0");
});

it("avanza cada tres segundos, reinicia y cancela el timer al desmontar", () => {
  vi.useFakeTimers();
  const view = render(<HomeOffersCarousel offers={offers} />);
  const cards = view.container.querySelectorAll<HTMLElement>('[data-slot="coverflow-card"]');
  expect(screen.queryByRole("button", { name: /carrusel/ })).toBeNull();
  act(() => vi.advanceTimersByTime(2999));
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("0");
  act(() => vi.advanceTimersByTime(1));
  expect(cards[1]!.style.getPropertyValue("--r")).toBe("0");
  act(() => vi.advanceTimersByTime(27000));
  expect(cards[0]!.style.getPropertyValue("--r")).toBe("0");
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("hover y foco pausan temporalmente y reanudan solos al salir", () => {
  vi.useFakeTimers();
  const view = render(<HomeOffersCarousel offers={offers} />);
  const region = screen.getByRole("region", { name: "Carrusel de ofertas recientes" });
  const first = view.container.querySelector<HTMLElement>('[data-slot="coverflow-card"]')!;
  fireEvent(region, Object.assign(new MouseEvent("pointerover", { bubbles: true }), { pointerType: "mouse" }));
  act(() => vi.advanceTimersByTime(6000));
  expect(first.style.getPropertyValue("--r")).toBe("0");
  fireEvent.pointerLeave(region);
  act(() => vi.advanceTimersByTime(3000));
  expect(first.style.getPropertyValue("--r")).toBe("1");
  const link = screen.getByRole("link", { name: "Oferta reciente 2" });
  fireEvent.focus(link);
  act(() => vi.advanceTimersByTime(6000));
  expect(first.style.getPropertyValue("--r")).toBe("1");
  fireEvent.blur(link, { relatedTarget: document.body });
  act(() => vi.advanceTimersByTime(3000));
  expect(first.style.getPropertyValue("--r")).toBe("2");
  fireEvent(region, Object.assign(new MouseEvent("pointerdown", { bubbles: true }), { pointerType: "touch" }));
  act(() => vi.advanceTimersByTime(3000));
  expect(first.style.getPropertyValue("--r")).toBe("3");
});

it("respeta reduced-motion sin agregar controles de pausa", () => {
  vi.useFakeTimers();
  const matchMedia = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...matchMedia(query), matches: query.includes("prefers-reduced-motion") }));
  const view = render(<HomeOffersCarousel offers={offers} />);
  const first = view.container.querySelector<HTMLElement>('[data-slot="coverflow-card"]')!;
  act(() => vi.advanceTimersByTime(9000));
  expect(first.style.getPropertyValue("--r")).toBe("0");
  expect(screen.getAllByRole("button")).toHaveLength(2);
});

it("no avanza en pestaña oculta y no crea timer para cero o una oferta", () => {
  vi.useFakeTimers();
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  const view = render(<HomeOffersCarousel offers={offers} />);
  const first = view.container.querySelector<HTMLElement>('[data-slot="coverflow-card"]')!;
  act(() => vi.advanceTimersByTime(6000));
  expect(first.style.getPropertyValue("--r")).toBe("0");
  hidden.mockReturnValue(false);
  act(() => vi.advanceTimersByTime(3000));
  expect(first.style.getPropertyValue("--r")).toBe("1");
  view.rerender(<HomeOffersCarousel offers={offers.slice(0, 1)} />);
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(<HomeOffersCarousel offers={[]} />);
  expect(vi.getTimerCount()).toBe(0);
});
