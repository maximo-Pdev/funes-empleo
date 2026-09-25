export function referralEligibility(input: { status: string; available: boolean; currentConsent: boolean;
  fresh: boolean; accountActive: boolean; archived: boolean; validCv: boolean }) {
  if (input.archived || !input.accountActive || input.status !== "active" || !input.available || !input.fresh) return "INVALID_TRANSITION";
  if (!input.currentConsent) return "CONSENT_REQUIRED";
  if (!input.validCv) return "VALID_CV_REQUIRED";
  return null;
}
