import { describe, expect, it } from "vitest";
import { consentChangeSchema } from "@/validation/consent";
import { protectedActions } from "../../fixtures/protected-actions";

describe("aceptación operativa", () => {
  it("mantiene válido el fixture HTTP que prueba la autorización del consentimiento", () => {
    const entry = protectedActions.find(action => action.name === "changeConsentAction");
    expect(entry).toBeDefined();
    const form = entry!.args()[1] as FormData;
    expect(consentChangeSchema.safeParse({
      version: form.get("version"),
      status: form.get("status"),
      confirmed: form.get("confirmed") === "on",
    }).success).toBe(true);
  });
  it("acepta únicamente una decisión afirmativa confirmada", () => {
    expect(consentChangeSchema.safeParse({ version: 2, status: "accepted", confirmed: true }).success).toBe(true);
    expect(consentChangeSchema.safeParse({ version: 2, status: "withdrawn", confirmed: true }).success).toBe(false);
  });
  it.each([false, undefined])("rechaza aceptación sin confirmación: %s", confirmed => {
    expect(consentChangeSchema.safeParse({ version: 2, status: "accepted", confirmed }).success).toBe(false);
  });
  it.each([null, "", "unknown"])("rechaza decisiones inválidas: %s", status => {
    expect(consentChangeSchema.safeParse({ version: 2, status, confirmed: true }).success).toBe(false);
  });
});
