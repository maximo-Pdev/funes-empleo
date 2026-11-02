import { describe, expect, it } from "vitest";
import { consentChangeSchema } from "@/validation/consent";

describe("aceptación operativa", () => {
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
