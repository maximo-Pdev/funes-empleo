import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn(), revalidatePath: vi.fn(), redirect: vi.fn(), createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createClient }));
vi.mock("@/features/accounts/service", () => ({ signIn: mocks.signIn, requestRecovery: vi.fn(), resendVerification: vi.fn(), updatePassword: vi.fn(), changeAccountStatus: vi.fn(), registerAccount: vi.fn() }));
import { loginAction, logoutAction } from "@/features/accounts/actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signOut: mocks.signOut } });
  mocks.redirect.mockImplementation((path: string) => { throw new Error(`Redirect ${path}`); });
});

it("invalida la navegación después de iniciar sesión correctamente", async () => {
  mocks.signIn.mockResolvedValue({ status: "active" });
  await expect(loginAction({ message: "", success: false }, new FormData())).rejects.toThrow("Redirect /account");
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(mocks.signOut).not.toHaveBeenCalled();
});

it("invalida la navegación al cerrar explícitamente solo la sesión local", async () => {
  await expect(logoutAction()).rejects.toThrow("Redirect /login");
  expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
});

it("no invalida el portal ni crea sesión ante credenciales inválidas", async () => {
  mocks.signIn.mockResolvedValue({ status: "invalid" });
  expect((await loginAction({ message: "", success: false }, new FormData())).success).toBe(false);
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
  expect(mocks.redirect).not.toHaveBeenCalled();
});
