import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/lib/env/server", () => ({ getServerEnvironment: () => ({ CONSENT_POLICY_VERSION: "demo-not-approved" }) }));
import { changeCandidateConsent } from "@/features/candidates/consent-service";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ account: { role: "candidate", status: "active" }, client: { rpc: mocks.rpc } });
  mocks.rpc.mockImplementation(async (name: string) => name === "candidate_consent_policy"
    ? { data: [{ version: "demo-not-approved", policy_hash: "a".repeat(64) }], error: null }
    : { data: 3, error: null });
});
describe("servicio de aceptación", () => {
  it("rechaza retiro manipulado antes de consultar sesión o RPC", async () => {
    await expect(changeCandidateConsent({ version: 2, status: "withdrawn", confirmed: true })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("envía la aceptación afirmativa con versión y política del servidor", async () => {
    await expect(changeCandidateConsent({ version: "2", status: "accepted", confirmed: true })).resolves.toBe(3);
    expect(mocks.rpc).toHaveBeenCalledWith("change_candidate_consent", {
      p_expected_version: 2, p_status: "accepted", p_policy_version: "demo-not-approved", p_policy_hash: "a".repeat(64),
    });
  });
  it.each([null, { account: { role: "company", status: "active" } }, { account: { role: "candidate", status: "archived" } }])("conserva autorización: %j", async session => {
    mocks.session.mockResolvedValue(session);
    await expect(changeCandidateConsent({ version: 2, status: "accepted", confirmed: true })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("conserva el rechazo de versión obsoleta del RPC", async () => {
    mocks.rpc.mockImplementation(async (name: string) => name === "candidate_consent_policy"
      ? { data: [{ version: "demo-not-approved", policy_hash: "a".repeat(64) }], error: null }
      : { data: null, error: { message: "CONFLICT_STALE_DATA" } });
    await expect(changeCandidateConsent({ version: 2, status: "accepted", confirmed: true })).rejects.toMatchObject({ code: "CONFLICT_STALE_DATA" });
  });
});
