import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

it("keeps the active company's panel label after using the candidate shortcut", async () => {
  readSession.mockResolvedValueOnce({ account: { role: "company", status: "active" } });
  render(await HomePage());
  fireEvent.click(screen.getByRole("link", { name: "Registrarme como postulante" }));
  await waitFor(() => expect(screen.getByLabelText("DNI")).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
  expect(screen.getByRole("link", { name: "Ir al panel de empresa" }).getAttribute("href")).toBe("/empresa");
});

it.each(["unexpected", ["empresa", "candidato"]])("keeps login as the safe default for unsupported registration values", async registro => {
  render(await HomePage({ searchParams: Promise.resolve({ registro }) }));
  expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();
  expect(screen.queryByRole("group", { name: "Tipo de cuenta" })).toBeNull();
});

it.each(["candidato", "empresa"])("removes the independent %s page instead of adding a redirect", role => {
  expect(existsSync(`src/app/(auth)/registro/${role}/page.tsx`)).toBe(false);
});
