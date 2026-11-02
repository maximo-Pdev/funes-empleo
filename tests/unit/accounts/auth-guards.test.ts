import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((href: string) => { throw new Error(`NEXT_REDIRECT:${href}`); }) }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import { requireActiveAccount } from "@/lib/auth/guards";
beforeEach(() => { vi.clearAllMocks(); });
it("returns anonymous application visitors to Home without an expiry notice", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(requireActiveAccount(undefined, { anonymousRedirect: "/" })).rejects.toThrow("NEXT_REDIRECT:/");
  expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
});
it("preserves the default expired-session destination for existing guarded callers", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(requireActiveAccount()).rejects.toThrow("NEXT_REDIRECT:");
  expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/?acceso=sesion-vencida");
});
it.each([["suspended", "/?acceso=suspendido"], ["archived", "/?acceso=sesion-vencida"]])("does not treat a %s account as an anonymous visitor", async (status, href) => {
  mocks.session.mockResolvedValue({ account: { role: "candidate", status } });
  await expect(requireActiveAccount(undefined, { anonymousRedirect: "/" })).rejects.toThrow("NEXT_REDIRECT:");
  expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(href);
});
it("preserves wrong-role rejection", async () => {
  mocks.session.mockResolvedValue({ account: { role: "company", status: "active" } });
  await expect(requireActiveAccount(["candidate"], { anonymousRedirect: "/" })).rejects.toThrow("NEXT_REDIRECT:/account");
});
it("returns the verified active session unchanged", async () => {
  const session = { account: { role: "candidate", status: "active" } };
  mocks.session.mockResolvedValue(session);
  await expect(requireActiveAccount(["candidate"], { anonymousRedirect: "/" })).resolves.toBe(session);
  expect(mocks.redirect).not.toHaveBeenCalled();
});
