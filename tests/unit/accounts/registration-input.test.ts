import { describe, expect, it } from "vitest";
import { registrationInput, accountCommandInput, passwordInput } from "@/features/accounts/input";
describe("entradas de cuentas T016", () => {
  it("rechaza el rol administrativo público", () => {
    for (const role of ["admin", "system", "ADMIN", "", null]) expect(registrationInput.safeParse({ role, email: "test@example.invalid", password: "Fictitious-Only!" }).success).toBe(false);
    expect(registrationInput.safeParse({ role: "candidate", email: "test@example.invalid", password: "Fictitious-Only!" }).success).toBe(true);
  });
  it("exige versión y confirmación explícita", () => {
    expect(accountCommandInput.safeParse({ accountId: "00000000-0000-4000-8000-000000000001", version: 1, command: "suspend", confirmed: false }).success).toBe(false);
    expect(accountCommandInput.safeParse({ accountId: "invalid", version: 0, command: "archive", confirmed: true }).success).toBe(false);
  });
  it("confirma la nueva contraseña", () => {
    expect(passwordInput.safeParse({ password: "Fictitious-A", confirmation: "Fictitious-B" }).success).toBe(false);
  });
});
