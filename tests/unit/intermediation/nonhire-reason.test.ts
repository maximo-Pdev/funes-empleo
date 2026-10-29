import { expect, it } from "vitest";
import { companyFeedbackInput } from "@/validation/referral-feedback";
const referralId = "0a000000-0000-4000-8000-000000000001";
it.each([undefined, "", "   "])("rejects a non-hire report without a meaningful reason: %j", message => {
  expect(companyFeedbackInput.safeParse({ referralId, reportedOutcome: "not_selected", message }).success).toBe(false);
});
it("keeps the reason on non-hire reports and preserves optional hire detail", () => {
  expect(companyFeedbackInput.parse({ referralId, reportedOutcome: "not_selected", message: "  Otro perfil seleccionado.  " }).message).toBe("Otro perfil seleccionado.");
  expect(companyFeedbackInput.safeParse({ referralId, reportedOutcome: "hired" }).success).toBe(true);
});
