import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { adminOutcomeInput, companyFeedbackInput, companyInterviewInput } from "@/validation/referral-feedback";

function databaseError(message: string): AppError {
  if (message === "CONFLICT_STALE_DATA") return new AppError("CONFLICT_STALE_DATA");
  if (message === "INVALID_TRANSITION") return new AppError("INVALID_TRANSITION");
  if (message === "INVALID_INPUT") return new AppError("VALIDATION_ERROR");
  if (message === "NOT_FOUND") return new AppError("NOT_FOUND");
  if (message === "AUTH_REQUIRED") return new AppError("AUTH_REQUIRED");
  return new AppError("INTERNAL_ERROR");
}

export async function submitCompanyFeedback(input: unknown) {
  const parsed = companyFeedbackInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.status !== "active" || session.account.role !== "company") throw new AppError("NOT_FOUND");
  const { data, error } = await session.client.rpc("submit_company_feedback", {
    p_referral: parsed.data.referralId,
    p_reported_outcome: parsed.data.reportedOutcome,
    p_message: parsed.data.message ?? null,
  });
  if (error) throw databaseError(error.message);
  return { feedbackId: data };
}

export async function submitCompanyInterview(input: unknown) {
  const parsed = companyInterviewInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.status !== "active" || session.account.role !== "company") throw new AppError("NOT_FOUND");
  const { data, error } = await session.client.rpc("submit_company_interview", {
    p_referral: parsed.data.referralId,
    p_expected_version: parsed.data.expectedVersion,
    p_status: parsed.data.status,
    p_scheduled_at: parsed.data.scheduledAt ?? null,
    p_held_at: parsed.data.heldAt ?? null,
    p_company_message: parsed.data.message ?? null,
  });
  if (error) throw databaseError(error.message);
  return { interviewId: data };
}

// A company report never confirms a final outcome. Only an active municipal
// administrator invokes this transition and supplies matching recorded evidence.
export async function confirmReportedOutcome(input: unknown) {
  const parsed = adminOutcomeInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.status !== "active" || session.account.role !== "admin") throw new AppError("ACCESS_DENIED");
  const { participationId, expectedVersion, outcome, lateCorrection, reason, feedbackId, contactId } = parsed.data;
  const command = lateCorrection
    ? outcome === "hired" ? "late_hire" : outcome === "not_selected" ? "late_not_selected" : "late_cancel"
    : outcome === "hired" ? "hire" : outcome === "not_selected" ? "not_select" : "cancel";
  const { data, error } = await session.client.rpc("transition_participation", {
    p_participation: participationId,
    p_expected_version: expectedVersion,
    p_command: command,
    p_reason: reason ?? null,
    p_feedback: feedbackId ?? null,
    p_contact: contactId ?? null,
  });
  if (error) throw databaseError(error.message);
  return { version: data };
}
