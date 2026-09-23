import { z } from "zod";

// Normative source: contracts/state-machines.md. These are state values only;
// executable transitions and actor/precondition checks belong to later tasks.
export const ACCOUNT_STATUSES = ["pending_verification", "active", "suspended", "archived"] as const;
export const COMPANY_PROFILE_STATUSES = ["incomplete", "active", "suspended", "archived"] as const;
export const CANDIDATE_PROFILE_STATUSES = [
  "draft", "active", "needs_update", "unavailable", "consent_withdrawn", "archived",
] as const;
export const OPENING_STATUSES = [
  "draft", "pending_review", "changes_requested", "published", "paused", "closed",
  "rejected", "suspended", "cancelled",
] as const;
export const PARTICIPATION_STATUSES = [
  "received", "under_review", "preinterview", "preselected", "referred",
  "company_interview", "awaiting_feedback", "hired", "not_selected", "withdrawn",
  "cancelled", "no_company_response",
] as const;
export const REFERRAL_ACCESS_STATUSES = ["active", "revoked", "expired_by_policy"] as const;
export const EXECUTABLE_REFERRAL_ACCESS_STATUSES = [REFERRAL_ACCESS_STATUSES[0], REFERRAL_ACCESS_STATUSES[1]] as const;
export const CONSENT_STATUSES = ["accepted", "withdrawn"] as const;
export const CV_STATUSES = ["valid", "superseded", "rejected", "archived"] as const;
export const IMPORT_BATCH_STATUSES = [
  "uploaded", "preview_ready", "blocked", "confirming", "completed", "failed", "archived",
] as const;
export const EXECUTABLE_IMPORT_BATCH_STATUSES = [
  IMPORT_BATCH_STATUSES[0], IMPORT_BATCH_STATUSES[1], IMPORT_BATCH_STATUSES[2],
  IMPORT_BATCH_STATUSES[3], IMPORT_BATCH_STATUSES[4], IMPORT_BATCH_STATUSES[5],
] as const;
export const IMPORT_ROW_STATUSES = [
  "valid", "warning", "invalid", "potential_duplicate", "unmapped_category", "imported",
] as const;

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const companyProfileStatusSchema = z.enum(COMPANY_PROFILE_STATUSES);
export const candidateProfileStatusSchema = z.enum(CANDIDATE_PROFILE_STATUSES);
export const openingStatusSchema = z.enum(OPENING_STATUSES);
export const participationStatusSchema = z.enum(PARTICIPATION_STATUSES);
export const referralAccessStatusSchema = z.enum(REFERRAL_ACCESS_STATUSES);
export const executableReferralAccessStatusSchema = z.enum(EXECUTABLE_REFERRAL_ACCESS_STATUSES);
export const consentStatusSchema = z.enum(CONSENT_STATUSES);
export const cvStatusSchema = z.enum(CV_STATUSES);
export const importBatchStatusSchema = z.enum(IMPORT_BATCH_STATUSES);
export const executableImportBatchStatusSchema = z.enum(EXECUTABLE_IMPORT_BATCH_STATUSES);
export const importRowStatusSchema = z.enum(IMPORT_ROW_STATUSES);

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type CompanyProfileStatus = (typeof COMPANY_PROFILE_STATUSES)[number];
export type CandidateProfileStatus = (typeof CANDIDATE_PROFILE_STATUSES)[number];
export type OpeningStatus = (typeof OPENING_STATUSES)[number];
export type ParticipationStatus = (typeof PARTICIPATION_STATUSES)[number];
export type ReferralAccessStatus = (typeof REFERRAL_ACCESS_STATUSES)[number];
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];
export type CvStatus = (typeof CV_STATUSES)[number];
export type ImportBatchStatus = (typeof IMPORT_BATCH_STATUSES)[number];
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];
