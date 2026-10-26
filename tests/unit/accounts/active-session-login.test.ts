import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ readSession: vi.fn(), createClient: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), redirect: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.readSession }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { signIn } from "@/features/accounts/service";
import { loginAction } from "@/features/accounts/actions";

const credentials = { email: "login@example.invalid", password: "Fictitious-Login-Only!" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signInWithPassword: mocks.signIn, signOut: mocks.signOut } });
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.readSession.mockResolvedValue(null);
});

it.each(["candidate", "company", "admin"])("preserves an active %s session before attempting authentication", async role => {
  mocks.readSession.mockResolvedValue({ account: { role, status: "active" } });
  expect(await signIn(credentials)).toEqual({ status: "already-active" });
  expect(mocks.createClient).not.toHaveBeenCalled();
  expect(mocks.signIn).not.toHaveBeenCalled();
  expect(mocks.signOut).not.toHaveBeenCalled();
});

it("returns existing-session feedback for direct login submissions without redirecting", async () => {
  mocks.readSession.mockResolvedValue({ account: { status: "active" } });
  const form = new FormData();
  Object.entries(credentials).forEach(([key, value]) => form.set(key, value));
  expect(await loginAction({ message: "", success: false }, form)).toEqual({ message: "Ya tenés la sesión iniciada", success: false, tone: "info" });
  expect(mocks.signIn).not.toHaveBeenCalled();
  expect(mocks.signOut).not.toHaveBeenCalled();
  expect(mocks.redirect).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});

it("retains anonymous login and verifies the resulting account", async () => {
  mocks.readSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ account: { status: "active" } });
  expect(await signIn(credentials)).toEqual({ status: "active" });
  expect(mocks.signIn).toHaveBeenCalledExactlyOnceWith(credentials);
  expect(mocks.signOut).not.toHaveBeenCalled();
});

it("retains invalid-credential feedback without signing out", async () => {
  mocks.signIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
  expect(await signIn(credentials)).toEqual({ status: "invalid" });
  expect(mocks.signOut).not.toHaveBeenCalled();
});

it("retains local cleanup when the newly authenticated account is suspended", async () => {
  mocks.readSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ account: { status: "suspended" } });
  expect(await signIn(credentials)).toEqual({ status: "suspended" });
  expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
});

it("does not authenticate when checking the existing session throws", async () => {
  mocks.readSession.mockRejectedValue(new Error("Session verification unavailable"));
  await expect(signIn(credentials)).rejects.toThrow("Session verification unavailable");
  expect(mocks.signIn).not.toHaveBeenCalled();
  expect(mocks.signOut).not.toHaveBeenCalled();
});
