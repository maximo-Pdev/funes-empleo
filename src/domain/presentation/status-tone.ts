import type { AccountStatus, CandidateProfileStatus, CompanyProfileStatus, ConsentStatus, CvStatus,
  ImportBatchStatus, OpeningStatus, ParticipationStatus, ReferralAccessStatus } from "@/domain/states";

/**
 * Semantic tone of a status indicator. The solid colour carries the meaning; the
 * soft variant is the same colour over a white surface.
 */
export type StatusTone = "green" | "red" | "amber" | "blue" | "violet" | "neutral";

/**
 * Tone per status catalog. Kept beside the labels so a status cannot be rendered
 * with a colour the rest of the portal does not expect.
 */
export const accountStatusTones = {
  pending_verification: "amber", active: "green", suspended: "red", archived: "neutral",
} satisfies Record<AccountStatus, StatusTone>;

export const companyProfileStatusTones = {
  incomplete: "amber", active: "green", suspended: "red", archived: "neutral",
} satisfies Record<CompanyProfileStatus, StatusTone>;

export const candidateProfileStatusTones = {
  draft: "neutral", active: "green", needs_update: "amber", unavailable: "neutral",
  consent_withdrawn: "red", archived: "neutral",
} satisfies Record<CandidateProfileStatus, StatusTone>;

export const openingStatusTones = {
  draft: "neutral", pending_review: "amber", changes_requested: "amber", published: "green",
  paused: "neutral", closed: "neutral", rejected: "red", suspended: "red", cancelled: "neutral",
} satisfies Record<OpeningStatus, StatusTone>;

export const participationStatusTones = {
  received: "neutral", under_review: "blue", preinterview: "blue", preselected: "blue",
  referred: "violet", company_interview: "violet", awaiting_feedback: "amber", hired: "green",
  not_selected: "neutral", withdrawn: "neutral", cancelled: "neutral", no_company_response: "neutral",
} satisfies Record<ParticipationStatus, StatusTone>;

export const referralAccessTones = {
  active: "green", revoked: "red", expired_by_policy: "amber",
} satisfies Record<ReferralAccessStatus, StatusTone>;

export const consentStatusTones = { accepted: "green", withdrawn: "red" } satisfies Record<ConsentStatus, StatusTone>;

export const cvStatusTones = {
  valid: "green", superseded: "neutral", rejected: "red", archived: "neutral",
} satisfies Record<CvStatus, StatusTone>;

export const importBatchStatusTones = {
  uploaded: "blue", preview_ready: "blue", blocked: "red", confirming: "amber",
  completed: "green", failed: "red", archived: "neutral",
} satisfies Record<ImportBatchStatus, StatusTone>;

export const interviewStatusTones = {
  scheduled: "blue", completed: "green", cancelled: "neutral", no_show: "red",
} as const satisfies Record<string, StatusTone>;

/** Company feedback awaiting Office confirmation. */
export const feedbackReviewTones = {
  pending_admin: "amber", accepted: "green", superseded: "neutral",
} as const satisfies Record<string, StatusTone>;

export const availabilityTones = { available: "green", unavailable: "neutral" } as const satisfies
  Record<string, StatusTone>;

/** Unrecognised or missing values fall back to the neutral tone. */
export function statusTone<T extends string>(tones: Record<T, StatusTone>, value: string | null | undefined): StatusTone {
  return value && Object.hasOwn(tones, value) ? tones[value as T] : "neutral";
}
