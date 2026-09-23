import { AppError } from "@/lib/errors/public-error";
import type { ParticipationStatus, ReferralAccessStatus } from "@/domain/states";

export type ParticipationCommand = "review" | "preinterview" | "preselect" | "refer" |
  "interview" | "await_feedback" | "hire" | "not_select" | "withdraw" | "cancel" |
  "no_response" | "late_hire" | "late_not_selected" | "late_cancel";

const internalStages: ParticipationStatus[] = ["received", "under_review", "preinterview", "preselected"];
const terminal = new Set<ParticipationStatus>(["hired", "not_selected", "withdrawn", "cancelled", "no_company_response"]);
const HOUR_720 = 720 * 60 * 60 * 1_000;

export interface ParticipationTransitionInput {
  actor: "candidate" | "admin" | "system" | "company";
  status: ParticipationStatus;
  version: number;
  expectedVersion: number;
  command: ParticipationCommand;
  reason?: string;
  origin?: "self_application" | "admin_nomination";
  candidateRequestRecorded?: boolean;
  candidateActive: boolean;
  companyActive: boolean;
  openingTreatable: boolean;
  consentCurrent: boolean;
  validCv: boolean;
  referralAccess?: ReferralAccessStatus;
  referredAt?: Date;
  evidence?: "portal_feedback" | "municipal_contact";
  now: Date;
}

export interface ParticipationDecision {
  nextStatus: ParticipationStatus;
  auditAction: string;
  skippedStages: ParticipationStatus[];
  createsReferral: boolean;
  revokeAccess: boolean;
  postHireAccessUntil: string | null;
  preservePriorClosure: boolean;
}

export function isFeedbackOverdue(referredAt: Date, now: Date): boolean {
  return now.getTime() >= referredAt.getTime() + HOUR_720;
}

export interface ReferralReadConditions {
  accessStatus: ReferralAccessStatus;
  consentCurrent: boolean;
  accountsActive: boolean;
  recordsActive: boolean;
  status: ParticipationStatus;
  postHireAccessUntil: Date | null;
  now: Date;
}

export function canReadReferredData(c: ReferralReadConditions): boolean {
  if (c.accessStatus !== "active" || !c.consentCurrent || !c.accountsActive || !c.recordsActive) return false;
  if (c.status === "hired") return c.postHireAccessUntil !== null && c.now < c.postHireAccessUntil;
  return ["referred", "company_interview", "awaiting_feedback"].includes(c.status) && c.postHireAccessUntil === null;
}

export function decideParticipationTransition(input: ParticipationTransitionInput): ParticipationDecision {
  if (input.version !== input.expectedVersion) throw new AppError("CONFLICT_STALE_DATA");
  const result = (nextStatus: ParticipationStatus, auditAction: string, options?: Partial<ParticipationDecision>): ParticipationDecision => ({
    nextStatus, auditAction, skippedStages: [], createsReferral: false, revokeAccess: false,
    postHireAccessUntil: null, preservePriorClosure: false, ...options,
  });
  const reason = input.reason?.trim();
  if (input.command === "no_response") {
    if (input.actor !== "system") throw new AppError("ACCESS_DENIED");
    if (!["referred", "company_interview", "awaiting_feedback"].includes(input.status) || !input.referredAt || !isFeedbackOverdue(input.referredAt, input.now)) throw new AppError("INVALID_TRANSITION");
    return result("no_company_response", "no_company_response", { revokeAccess: true });
  }
  if (input.command === "withdraw") {
    if (input.actor !== "candidate" && input.actor !== "admin") throw new AppError("ACCESS_DENIED");
    if (terminal.has(input.status) || (input.actor === "admin" && !input.candidateRequestRecorded)) throw new AppError("INVALID_TRANSITION");
    return result("withdrawn", "outcome_confirmed", { revokeAccess: true });
  }
  if (input.actor !== "admin") throw new AppError("ACCESS_DENIED");
  if (input.command.startsWith("late_")) {
    if (input.status !== "no_company_response") throw new AppError("INVALID_TRANSITION");
    if (!input.evidence || !reason) throw new AppError("VALIDATION_ERROR");
    const next = input.command === "late_hire" ? "hired" : input.command === "late_not_selected" ? "not_selected" : "cancelled";
    return result(next, "outcome_corrected", { preservePriorClosure: true, revokeAccess: true });
  }
  if (terminal.has(input.status)) throw new AppError("INVALID_TRANSITION");
  if (input.command === "cancel") {
    if (!reason || reason.length > 1_000) throw new AppError("VALIDATION_ERROR");
    return result("cancelled", "outcome_confirmed", { revokeAccess: true });
  }
  if (input.command === "hire" || input.command === "not_select") {
    if (!["referred", "company_interview", "awaiting_feedback"].includes(input.status)) throw new AppError("INVALID_TRANSITION");
    if (input.command === "not_select") return result("not_selected", "outcome_confirmed", { revokeAccess: true });
    const retain = input.referralAccess === "active" && input.consentCurrent && input.companyActive && input.candidateActive && input.openingTreatable;
    return result("hired", "outcome_confirmed", { postHireAccessUntil: retain ? new Date(input.now.getTime() + HOUR_720).toISOString() : null });
  }
  if (input.command === "interview" || input.command === "await_feedback") {
    const allowed = input.command === "interview" ? ["referred", "awaiting_feedback"] : ["referred", "company_interview"];
    if (!allowed.includes(input.status)) throw new AppError("INVALID_TRANSITION");
    return result(input.command === "interview" ? "company_interview" : "awaiting_feedback", "participation_advanced");
  }
  const target: Record<"review" | "preinterview" | "preselect" | "refer", ParticipationStatus> = {
    review: "under_review", preinterview: "preinterview", preselect: "preselected", refer: "referred",
  };
  if (!(input.command in target)) throw new AppError("INVALID_TRANSITION");
  const command = input.command as keyof typeof target;
  const fromIndex = internalStages.indexOf(input.status);
  const toIndex = command === "refer" ? internalStages.length : internalStages.indexOf(target[command]);
  if (fromIndex < 0 || toIndex <= fromIndex) throw new AppError("INVALID_TRANSITION");
  const skippedStages = internalStages.slice(fromIndex + 1, toIndex);
  if (skippedStages.length > 0 && (!reason || reason.length > 1_000)) throw new AppError("VALIDATION_ERROR");
  if (command === "refer") {
    if (!input.consentCurrent) throw new AppError("CONSENT_REQUIRED");
    if (!input.validCv) throw new AppError("VALID_CV_REQUIRED");
    if (!input.candidateActive || !input.companyActive || !input.openingTreatable) throw new AppError("INVALID_TRANSITION");
  }
  return result(target[command], skippedStages.length ? "stage_skipped" : command === "refer" ? "referral_created" : "participation_advanced", {
    skippedStages, createsReferral: command === "refer",
  });
}
