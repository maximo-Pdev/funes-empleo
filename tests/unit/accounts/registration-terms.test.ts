import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), signUp: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createClient }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://portal.example.invalid" }) }));
import { registerCandidate } from "@/features/candidates/registration-service";
import { registerCandidateAction } from "@/features/candidates/registration-actions";
import { registerCompany } from "@/features/companies/service";
import { registerCompanyAction } from "@/features/companies/company-actions";
import { registerAccount } from "@/features/accounts/service";
import { registerAccountAction } from "@/features/accounts/actions";

const password = "Fictitious-Registration-Only!";
const version = "demo-terms-draft-1";
it("also guards the legacy registration action and service against omitted terms", async () => {
  const values = { email: "registro@example.invalid", role: "candidate", password, confirmation: password };
  expect(await registerAccount(values)).toBe(false);
  expect((await registerAccountAction({ message: "", success: false }, form(values))).success).toBe(false);
  expect(mocks.signUp).not.toHaveBeenCalled();
});
const cases = [
  { role: "candidate", service: registerCandidate, action: registerCandidateAction,
    values: { name: "Persona ficticia", dni: "99000001", email: "registro@example.invalid", password, confirmation: password } },
  { role: "company", service: registerCompany, action: registerCompanyAction,
    values: { legalName: "Empresa ficticia", cuit: "30999999997", responsibleName: "Responsable ficticio", email: "empresa@example.invalid", phone: "", activity: "Servicios", locality: "Funes", password, confirmation: password } },
];
function form(values: object) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) result.set(key, String(value));
  return result;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signUp: mocks.signUp } });
  mocks.signUp.mockResolvedValue({ data: {}, error: null });
});
describe.each(cases)("términos de registro $role", ({ role, service, action, values }) => {
  it.each([
    {}, { termsAccepted: false, termsVersion: version }, { termsAccepted: "on", termsVersion: version },
    { termsAccepted: true }, { termsAccepted: true, termsVersion: "previous-draft" },
  ])("rechaza aceptación omitida, no explícita o versión inválida antes de Auth: %j", async terms => {
    await expect(service({ ...values, ...terms })).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it.each([{}, { termsAccepted: "", termsVersion: version }, { termsAccepted: "on", termsVersion: "previous-draft" }])("valida también la acción directa: %j", async terms => {
    const response = await action({ message: "", success: false }, form({ ...values, ...terms }));
    expect(response.success).toBe(false);
    expect(response.message).toMatch(/términos/i);
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it("transporta solo la versión aceptada y preserva la respuesta segura del proveedor", async () => {
    const input = form({ ...values, termsAccepted: "on", termsVersion: version });
    const success = await action({ message: "", success: false }, input);
    expect(success.success).toBe(true);
    expect(mocks.signUp.mock.calls[0]![0].options.data).toMatchObject({ role, registration_terms_version: version, registration_terms_accepted: true });
    expect(mocks.signUp.mock.calls[0]![0].options.data).not.toHaveProperty("consent");
    mocks.signUp.mockResolvedValue({ data: null, error: { message: "PRIVATE-provider-detail" } });
    expect(await action({ message: "", success: false }, input)).toEqual(success);
    expect(JSON.stringify(success)).not.toContain("PRIVATE");
  });
});
