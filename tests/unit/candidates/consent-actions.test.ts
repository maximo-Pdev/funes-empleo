import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/lib/env/server", () => ({ getServerEnvironment: () => ({ CONSENT_POLICY_VERSION: "demo-not-approved" }) }));
import { changeConsentAction } from "@/features/candidates/consent-actions";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ account: { role: "candidate", status: "active" }, client: { rpc: mocks.rpc } });
  mocks.rpc.mockImplementation(async (name: string) => name === "candidate_consent_policy"
    ? { data: [{ version: "demo-not-approved", policy_hash: "a".repeat(64) }], error: null }
    : { data: 3, error: null });
});
it.each(["withdrawn", "", "unknown"])("no permite retiro ni decisiones inválidas desde FormData: %s", async status => {
  const form = new FormData();
  form.set("version", "2"); form.set("status", status); form.set("confirmed", "on");
  expect((await changeConsentAction({ message: "", success: false }, form)).success).toBe(false);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("registra aceptación sin prometer reabrir casos y actualiza ambos paneles", async () => {
  const form = new FormData();
  form.set("version", "2"); form.set("status", "accepted"); form.set("confirmed", "on");
  expect(await changeConsentAction({ message: "", success: false }, form)).toEqual({
    message: "Consentimiento registrado. Las participaciones cerradas no se reabren.", success: true,
  });
  expect(mocks.revalidate.mock.calls).toEqual([["/account"], ["/dashboard"]]);
});
it("no acepta una casilla ausente", async () => {
  const form = new FormData(); form.set("version", "2"); form.set("status", "accepted");
  expect((await changeConsentAction({ message: "", success: false }, form)).success).toBe(false);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
