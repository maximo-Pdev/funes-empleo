import { beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HOME_REGISTRATION_EVENT } from "@/features/accounts/registration-navigation";
import { HomeHero } from "@/app/(public)/home-hero";
import { existsSync } from "node:fs";

vi.mock("server-only", () => ({}));
const { readSession } = vi.hoisted(() => ({ readSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: readSession }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: vi.fn(async () => ({ items: [] })) }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), passwordAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
import HomePage from "@/app/(public)/page";

beforeEach(() => {
  readSession.mockReset();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

it.each([
  ["Registrarme como postulante", "Postulante", "DNI"],
  ["Registrar empresa", "Empresa", "CUIT"],
])("opens the matching Home form and focuses it when activating %s repeatedly", async (label, radio, field) => {
  render(await HomePage());
  const closing = screen.getByRole("region", { name: "¿Listo para dar el siguiente paso?" });
  const link = within(closing).getByRole("link", { name: label });
  expect(link.getAttribute("href")).not.toMatch(/^\/registro\//);
  for (let repeat = 0; repeat < 2; repeat++) {
    fireEvent.click(link);
    await waitFor(() => expect(screen.getByRole("radio", { name: radio })).toHaveProperty("checked", true));
    const panel = screen.getByRole("region", { name: "Acceso al portal" });
    await waitFor(() => expect(document.activeElement).toBe(panel));
    expect(window.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 0 }));
    expect(screen.getByLabelText(field)).toBeTruthy();
    expect(window.location.pathname).toBe("/");
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
  }
});

it.each([
  ["candidato", "Postulante", "DNI"],
  ["empresa", "Empresa", "CUIT"],
])("opens the %s registration from canonical Home deep links", async (registro, radio, field) => {
  render(await HomePage({ searchParams: Promise.resolve({ registro }) }));
  expect(screen.getByRole("radio", { name: radio })).toHaveProperty("checked", true);
  expect(screen.getByLabelText(field)).toBeTruthy();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("region", { name: "Acceso al portal" })));
});

it("keeps remaining Home registration shortcuts on Home after replacing the role guide", async () => {
  const { container } = render(await HomePage());
  expect(container.querySelectorAll('a[href^="/registro/"]')).toHaveLength(0);
  expect(screen.queryByRole("link", { name: "Crear cuenta de postulante" })).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Registrarme como postulante" }));
  await waitFor(() => expect(screen.getByLabelText("DNI")).toBeTruthy());
});

it.each(["candidate", "company", "admin"])("ignores registration route selection and events for an active %s", async role => {
  for (const registro of ["candidato", "empresa"]) {
    readSession.mockResolvedValueOnce({ account: { role, status: "active" } });
    const view = render(await HomePage({ searchParams: Promise.resolve({ registro }) }));
    const assertLogin = () => {
      expect(screen.getByText("Tu sesión está activa. Continuá desde tu panel.")).toBeTruthy();
      expect(screen.queryByRole("group", { name: "Opciones de acceso" })).toBeNull();
      expect(screen.getByRole("heading", { level: 1 }).parentElement?.getAttribute("data-view")).toBe("login");
      expect(screen.getByRole("region", { name: "Acceso al portal" }).getAttribute("data-mode")).toBe("login");
      expect(screen.queryByRole("radio")).toBeNull();
      expect(view.container.querySelector("form")).toBeNull();
    };
    assertLogin();
    for (const requestedRole of ["candidate", "company"]) {
      act(() => { window.dispatchEvent(new CustomEvent(HOME_REGISTRATION_EVENT, { detail: requestedRole })); });
      assertLogin();
    }
    view.unmount();
  }
});

it("returns the hero and access panel to login when a session becomes active", () => {
  const view = render(<HomeHero authenticated={false} initialView="company" />);
  expect(screen.getByLabelText("CUIT")).toBeTruthy();
  view.rerender(<HomeHero authenticated panelHref="/empresa" panelLabel="Ir al panel de empresa" initialView="company" />);
  expect(screen.getByText("Tu sesión está activa. Continuá desde tu panel.")).toBeTruthy();
  expect(screen.queryByRole("group", { name: "Opciones de acceso" })).toBeNull();
  expect(screen.getByRole("heading", { level: 1 }).parentElement?.getAttribute("data-view")).toBe("login");
  expect(screen.queryByRole("radio")).toBeNull();
  expect(view.container.querySelector("form")).toBeNull();
});

it.each(["candidate", "company", "admin"])("hides closing registration entrances for an active %s while keeping municipal contact", async role => {
  readSession.mockResolvedValueOnce({ account: { role, status: "active" } });
  const { container } = render(await HomePage());
  const closing = screen.getByRole("region", { name: "¿Listo para dar el siguiente paso?" });
  expect(within(closing).queryByRole("link", { name: "Registrarme como postulante" })).toBeNull();
  expect(within(closing).queryByRole("link", { name: "Registrar empresa" })).toBeNull();
  expect(container.querySelectorAll('a[href*="registro="]')).toHaveLength(0);
  expect(within(closing).queryByText(/Creá tu cuenta/)).toBeNull();
  expect(within(closing).getByText("Oficina de Empleo")).toBeTruthy();
  expect(within(closing).getByText("[Correo de contacto]")).toBeTruthy();
});

it.each(["unexpected", ["empresa", "candidato"]])("keeps login as the safe default for unsupported registration values", async registro => {
  render(await HomePage({ searchParams: Promise.resolve({ registro }) }));
  expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();
  expect(screen.queryByRole("group", { name: "Tipo de cuenta" })).toBeNull();
});

it.each(["candidato", "empresa"])("removes the independent %s page instead of adding a redirect", role => {
  expect(existsSync(`src/app/(auth)/registro/${role}/page.tsx`)).toBe(false);
});
