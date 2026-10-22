import { expect, it } from "vitest";
import { candidatePhoneField, companyPhoneField, cuitField, dniField } from "@/components/forms/identifier-fields";
import { phoneSchema } from "@/validation/candidate-profile";
import { cuitSchema, phoneContactSchema } from "@/validation/common";

it.each([
  [dniField, "99.123.456", true], [dniField, "9912345", true], [dniField, "123456789", false], [dniField, "dni12345678", false],
  [cuitField, "30-99999999-7", true], [cuitField, "30999999997", true], [cuitField, "123", false],
  [candidatePhoneField, "+54 (341) 555-0100", true], [candidatePhoneField, "teléfono", false],
  [companyPhoneField, "+54 (341) 555.0100", true], [companyPhoneField, "1234567890123456789012", false],
  [companyPhoneField, "++++1234567", false],
] as const)("el patrón HTML v %j admite %s: %s", (field, value, valid) => {
  expect(new RegExp(`^(?:${field.pattern})$`, "v").test(value)).toBe(valid);
});

it("los formatos aceptados de contacto e identificador conservan validación de servidor", () => {
  expect(cuitSchema.safeParse("30-99999999-7").success).toBe(true);
  expect(phoneSchema.safeParse({ version: 1, phone: "+54 (341) 555-0100" }).success).toBe(true);
  expect(phoneContactSchema.safeParse("+54 (341) 555.0100").success).toBe(true);
});
