"use server";

import { revalidatePath } from "next/cache";
import { adminActionFailure } from "@/lib/errors/admin-action";
import type { AdminMutationResult } from "@/lib/errors/admin-mutation-result";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { funesLocalToIso } from "@/lib/time/funes-local";
import { referCandidate } from "@/features/referrals/service";
import { confirmReportedOutcome } from "@/features/referrals/feedback-service";
import { adminParticipationActionInput } from "@/validation/admin-participation-action";
import { z } from "zod";
import { recordEvaluation } from "./evaluation-service";

export async function recordEvaluationAction(input: unknown): Promise<AdminMutationResult> {
  try {
    const normalized = typeof input === "object" && input !== null &&
      "command" in input && input.command === "record_contact" &&
      "occurredAtLocal" in input && typeof input.occurredAtLocal === "string"
      ? { ...input, occurredAt: funesLocalToIso(input.occurredAtLocal) } : input;
    await recordEvaluation(normalized);
    const participationId = typeof input === "object" && input !== null && "participationId" in input &&
      typeof input.participationId === "string" ? input.participationId : "";
    const candidateId = typeof input === "object" && input !== null && "candidateId" in input &&
      typeof input.candidateId === "string" ? input.candidateId : "";
    revalidatePath("/admin/participations");
    if (participationId) revalidatePath(`/admin/participations/${participationId}`);
    if (candidateId) revalidatePath(`/admin/candidates/${candidateId}`);
    return { code: "OK" };
  } catch (error) { return adminActionFailure(error); }
}

export async function adminParticipationAction(input: unknown): Promise<AdminMutationResult> {
  try {
    const parsed = adminParticipationActionInput.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR");
    const value = parsed.data;
    const session = await readAccountSession();
    if (!session || session.account.role !== "admin" || session.account.status !== "active") {
      throw new AppError("ACCESS_DENIED");
    }
    if (value.command === "refer") {
      await referCandidate({ participationId: value.participationId, expectedVersion: value.version,
        reason: value.reason || undefined });
    } else if (value.command === "record_preinterview") {
      await recordEvaluation({ command: value.command, participationId: value.participationId,
        version: value.version, channel: value.channel, summary: value.summary,
        scheduledAt: value.scheduledAtLocal ? funesLocalToIso(value.scheduledAtLocal) : undefined,
        heldAt: value.heldAtLocal ? funesLocalToIso(value.heldAtLocal) : undefined,
        recommendation: value.recommendation, reason: value.reason || undefined });
    } else if (["start_review", "preselect", "skip_to_preinterview", "skip_to_preselected",
      "mark_awaiting_feedback"].includes(value.command)) {
      await recordEvaluation({ command: value.command, participationId: value.participationId,
        version: value.version, reason: value.reason || undefined });
    } else if (["confirm_hired", "confirm_not_selected", "correct_hired", "correct_not_selected",
      "correct_cancelled"].includes(value.command)) {
      await confirmReportedOutcome({ participationId: value.participationId,
        expectedVersion: value.version,
        outcome: value.command.endsWith("hired") ? "hired" :
          value.command.endsWith("not_selected") ? "not_selected" : "cancelled",
        lateCorrection: value.command.startsWith("correct_"),
        reason: value.reason || undefined, feedbackId: value.feedbackId,
        contactId: value.contactId });
    } else {
      const result = await session.client.rpc("transition_participation", {
        p_participation: value.participationId, p_expected_version: value.version,
        p_command: value.command === "withdraw_on_request" ? "withdraw" : "cancel",
        p_reason: value.reason || null,
        p_candidate_request: value.candidateRequestId ?? null,
        p_feedback: value.feedbackId ?? null,
      });
      if (result.error) throw workflowRpcError(result.error.message);
    }
    revalidatePath("/admin/participations");
    revalidatePath(`/admin/participations/${value.participationId}`);
    return { code: "OK" };
  } catch (error) { return adminActionFailure(error); }
}

const confirmFeedbackInput = z.object({
  participationId: z.guid(), version: z.number().int().positive(),
  feedbackId: z.guid(), outcome: z.enum(["hired", "not_selected", "cancelled"]),
  reason: z.string().trim().max(1000), lateCorrection: z.boolean(),
});

export async function confirmFeedbackAction(input: unknown): Promise<AdminMutationResult> {
  try {
    const parsed = confirmFeedbackInput.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR");
    const value = parsed.data;
    await confirmReportedOutcome({ participationId: value.participationId,
      expectedVersion: value.version, outcome: value.outcome,
      feedbackId: value.feedbackId, reason: value.reason || undefined,
      lateCorrection: value.lateCorrection });
    revalidatePath("/admin/participations");
    revalidatePath(`/admin/participations/${value.participationId}`);
    return { code: "OK" };
  } catch (error) { return adminActionFailure(error); }
}
