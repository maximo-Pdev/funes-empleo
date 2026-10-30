import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), signUp: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createClient }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://portal.example.invalid" }) }));

import { registrationInput } from "@/features/accounts/input";
import { registerAccount } from "@/features/accounts/service";
import { registerAccountAction } from "@/features/accounts/actions";
import { registerCandidate } from "@/features/candidates/registration-service";
import { registerCandidateAction } from "@/features/candidates/registration-actions";
import { registerCompany } from "@/features/companies/service";
import { registerCompanyAction } from "@/features/companies/company-actions";
import { candidateRegistrationSchema } from "@/validation/candidate-registration";
import { companyRegistrationSchema } from "@/validation/company";

const password = "Fictitious-Registration-Only!";
const email = "registro@example.invalid";
const acceptedTerms = { termsAccepted: true, termsVersion: "demo-terms-draft-1" };
const cases = [
  { name: "cuenta", schema: registrationInput, service: registerAccount, action: registerAccountAction,
    values: { ...acceptedTerms, role: "candidate", email, password } },
  { name: "candidato", schema: candidateRegistrationSchema, service: registerCandidate, action: registerCandidateAction,
    values: { ...acceptedTerms, name: "Persona ficticia", dni: "99000001", email, password } },
  { name: "empresa", schema: companyRegistrationSchema, service: registerCompany, action: registerCompanyAction,
    values: { ...acceptedTerms, legalName: "Empresa ficticia", cuit: "30999999997", responsibleName: "Responsable ficticio",
      email, phone: "", activity: "Servicios", locality: "Funes", password } },
];

function form(values: object) {
  const result = new FormData();
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === "string") result.set(name, value);
    else if (value === true) result.set(name, "on");
  }
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signUp: mocks.signUp } });
  mocks.signUp.mockResolvedValue({ data: {}, error: null });
});

describe.each(cases)("confirmación en registro de $name", ({ schema, service, action, values }) => {
  it.each([undefined, null, "", "Otra-Contraseña-Ficticia", `${password} `])("rechaza confirmación inválida %s antes de Auth", async confirmation => {
    const input = { ...values, confirmation };
    expect(schema.safeParse(input).success).toBe(false);
    await Promise.allSettled([service(input)]);
    const response = await action({ message: "", success: false }, form(input));
    expect(response.success).toBe(false);
    expect(response.message).toMatch(/contraseñas.*coincidir/i);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it.each([5, 129])("rechaza contraseñas de %i caracteres aunque coincidan", async length => {
    const input = { ...values, password: "f".repeat(length), confirmation: "f".repeat(length) };
    expect(schema.safeParse(input).success).toBe(false);
    const response = await action({ message: "", success: false }, form(input));
    expect(response.success).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([6, 128])("acepta el límite de %i caracteres sin modificar la contraseña", length => {
    const value = " ".repeat(length - 1) + "f";
    const result = schema.parse({ ...values, password: value, confirmation: value });
    expect(result.password).toBe(value);
    expect(result.confirmation).toBe(value);
  });

  it("transporta la confirmación hasta el servicio pero nunca a Auth o metadata", async () => {
    const response = await action({ message: "", success: false }, form({ ...values, confirmation: password }));
    expect(response.success).toBe(true);
    expect(mocks.signUp).toHaveBeenCalledOnce();
    expect(mocks.signUp).toHaveBeenCalledWith({
      email, password, options: { emailRedirectTo: "https://portal.example.invalid/auth/callback", data: expect.any(Object) },
    });
    const input = mocks.signUp.mock.calls[0]![0];
    expect(input).not.toHaveProperty("confirmation");
    expect(input.options.data).not.toHaveProperty("confirmation");
    expect(input.options.data).not.toHaveProperty("password");
  });

  it("conserva una respuesta no enumerativa ante un error del proveedor", async () => {
    const input = form({ ...values, confirmation: password });
    const success = await action({ message: "", success: false }, input);
    mocks.signUp.mockResolvedValue({ data: null, error: { message: "PRIVATE-provider-detail" } });
    expect(await action({ message: "", success: false }, input)).toEqual(success);
    expect(JSON.stringify(success)).not.toContain(password);
    expect(JSON.stringify(success)).not.toContain("PRIVATE");
  });
});
