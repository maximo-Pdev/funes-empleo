import { describe, expect, it } from "vitest";
import { canCancelCompanyOpening, canEditCompanyOpening } from "@/features/openings/company-opening-policy";
import { openingCancelSchema } from "@/validation/opening";

describe("gestión empresarial de ofertas", () => {
  it.each(["draft", "changes_requested", "published"])("permite edición de %s", status => {
    expect(canEditCompanyOpening(status)).toBe(true);
  });
  it.each(["pending_review", "paused", "suspended", "cancelled", "closed", "rejected", "unknown"])("no permite edición de %s", status => {
    expect(canEditCompanyOpening(status)).toBe(false);
  });
  it.each(["draft", "pending_review", "changes_requested", "published", "paused", "suspended"])("permite cancelación de %s", status => {
    expect(canCancelCompanyOpening(status)).toBe(true);
  });
  it.each(["cancelled", "closed", "rejected", "unknown"])("preserva estados finales: %s", status => {
    expect(canCancelCompanyOpening(status)).toBe(false);
  });
  const valid = { id: "0a000000-0000-4000-8000-000000000001", version: "2", reason: "  Motivo ficticio  ", confirmed: true };
  it("valida confirmación afirmativa, motivo, identificador y versión antes de ejecutar", () => {
    expect(openingCancelSchema.parse(valid)).toMatchObject({ reason: "Motivo ficticio", version: 2 });
    for (const invalid of [{ confirmed: false }, { reason: " " }, { reason: "x".repeat(1001) }, { version: 0 }, { id: "incorrecto" }]) {
      expect(openingCancelSchema.safeParse({ ...valid, ...invalid }).success).toBe(false);
    }
  });
});
