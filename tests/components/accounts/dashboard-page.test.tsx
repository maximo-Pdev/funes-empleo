import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  redirect: vi.fn((href: string) => { throw new Error(`NEXT_REDIRECT:${href}`); }),
  renderCandidateAccount: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/app/(auth)/account/candidate-account", () => ({ renderCandidateAccount: mocks.renderCandidateAccount }));
vi.mock("@/features/accounts/navigation", () => ({
  getPanelHref: (role: string) => (role === "company" ? "/empresa" : "/account"),
}));
import DashboardPage from "@/app/(auth)/dashboard/page";

it.each(["dashboard", "perfil", "postulaciones", "ofertas"])("renders candidate section %s under its own base path", async section => {
  // Route-dispatch contract only; candidate-pages renders each real shared canvas.
  mocks.guard.mockResolvedValue({ account: { role: "candidate" }, user: { email: "persona@example.test" } });
  mocks.renderCandidateAccount.mockResolvedValue(<p>panel</p>);
  const view = await DashboardPage({ searchParams: Promise.resolve({ section }) });
  expect(mocks.renderCandidateAccount).toHaveBeenCalledWith({ params: { section }, email: "persona@example.test", basePath: "/dashboard" });
  expect(mocks.redirect).not.toHaveBeenCalled();
  expect(view).toBeTruthy();
});

it.each([["company", "/empresa"], ["admin", "/account"]])("sends %s to its own panel", async (role, href) => {
  mocks.guard.mockResolvedValue({ account: { role }, user: { email: "persona@example.test" } });
  await expect(DashboardPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(`NEXT_REDIRECT:${href}`);
  expect(mocks.redirect).toHaveBeenCalledWith(href);
  expect(mocks.renderCandidateAccount).not.toHaveBeenCalled();
});
