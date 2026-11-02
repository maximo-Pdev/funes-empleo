import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn(async () => null) }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), passwordAction: vi.fn(), logoutAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
const { counts, offers } = vi.hoisted(() => ({ counts: vi.fn(), offers: vi.fn() }));
vi.mock("@/features/metrics/public-service", () => ({ getPublicPortalCounts: counts }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: offers }));
import HomePage from "@/app/(public)/page";

beforeEach(() => {
  counts.mockReset().mockResolvedValue({ candidates: 1234, companies: 17, offers: 27 });
  offers.mockReset().mockResolvedValue({ items: [], total: 27, page: 1, pageSize: 10 });
});

it("replaces only the role guide with actual public counts, independent of the carousel", async () => {
  render(await HomePage());
  const metrics = screen.getByRole("region", { name: "El portal en números" });
  const entries: [string, string][] = [["Postulantes registrados", "1.234"], ["Empresas registradas", "17"], ["Ofertas vigentes", "27"]];
  for (const [label, value] of entries) {
    expect(within(within(metrics).getByText(label).parentElement!).getByText(value)).toBeTruthy();
  }
  expect(counts).toHaveBeenCalledOnce();
  expect(offers).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  expect(screen.queryByText("Cada perfil entra por el camino correcto")).toBeNull();
  for (const heading of ["Simple para usar, cuidadoso con los datos.", "Lo que más nos preguntan", "¿Listo para dar el siguiente paso?"]) {
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
  }
  expect(screen.getByRole("link", { name: "Registrarme como postulante" })).toBeTruthy();
});

it("shows genuine zeros rather than an unavailable state", async () => {
  counts.mockResolvedValue({ candidates: 0, companies: 0, offers: 0 });
  render(await HomePage());
  expect(within(screen.getByRole("region", { name: "El portal en números" })).getAllByText("0")).toHaveLength(3);
  expect(screen.queryByText(/No pudimos cargar las métricas/)).toBeNull();
});

it("does not fabricate zero counts when the aggregate is unavailable", async () => {
  counts.mockRejectedValue(new Error("PRIVATE-test-error"));
  render(await HomePage());
  const metrics = screen.getByRole("region", { name: "El portal en números" });
  expect(within(metrics).getAllByText("—")).toHaveLength(3);
  expect(within(metrics).getByText(/No pudimos cargar las métricas/)).toBeTruthy();
  expect(metrics.textContent).not.toContain("PRIVATE-test-error");
  expect(screen.getByRole("region", { name: "Ofertas disponibles" })).toBeTruthy();
});
