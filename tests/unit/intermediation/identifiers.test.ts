import { describe, expect, it } from "vitest";
import { companyFeedbackInput, adminOutcomeInput } from "@/validation/referral-feedback";

// The local seed derives stable GUIDs from hashes. They are valid PostgreSQL
// UUIDs, but their version nibble is outside the random UUID versions accepted
// by z.uuid(). Application boundaries must still accept those opaque IDs.
const fixtureId = "14e2e8c6-75aa-e88c-0273-463d6b26d141";

describe("identificadores opacos de intermediación", () => {
  it("acepta GUIDs determinísticos del seed en feedback y resultados", () => {
    expect(companyFeedbackInput.safeParse({
      referralId: fixtureId,
      reportedOutcome: "hired",
    }).success).toBe(true);
    expect(adminOutcomeInput.safeParse({
      participationId: fixtureId,
      expectedVersion: 1,
      outcome: "hired",
    }).success).toBe(true);
  });

  it("sigue rechazando identificadores que no tienen formato GUID", () => {
    expect(companyFeedbackInput.safeParse({
      referralId: "no-es-un-id",
      reportedOutcome: "hired",
    }).success).toBe(false);
  });
});
