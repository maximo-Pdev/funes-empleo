import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { evaluationInput } from "@/validation/evaluation";

export async function recordEvaluation(input: unknown) {
  const parsed = evaluationInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  const value = parsed.data;
  if (value.command === "record_preinterview") {
    const result = await session.client.rpc("record_preinterview", {
      p_participation: value.participationId, p_expected_version: value.version,
      p_channel: value.channel, p_scheduled_at: value.scheduledAt ?? null,
      p_held_at: value.heldAt ?? null, p_summary: value.summary,
      p_recommendation: value.recommendation, p_skip_reason: value.reason ?? null,
    });
    if (result.error) throw workflowRpcError(result.error.message);
    return { version: result.data };
  }
  if (value.command === "record_contact") {
    const result = await session.client.rpc("record_contact", {
      p_participation: value.participationId, p_expected_version: value.version,
      p_channel: value.channel, p_direction: value.direction,
      p_occurred_at: value.occurredAt, p_summary: value.summary,
      p_next_action_at: value.nextActionAt ?? null,
    });
    if (result.error) throw workflowRpcError(result.error.message);
    return { version: result.data };
  }
  if (value.command === "record_training_guidance" || value.command === "record_applicant_note") {
    const result = await session.client.rpc("record_internal_note", {
      p_candidate: value.candidateId, p_expected_version: value.version,
      p_participation: value.command === "record_applicant_note" ? value.participationId ?? null : null,
      p_kind: value.command === "record_applicant_note" ? "applicant" : "training_guidance",
      p_body: value.body, p_supersedes: value.supersedesNoteId ?? null,
    });
    if (result.error) throw workflowRpcError(result.error.message);
    return { noteId: result.data };
  }
  const command = {
    start_review: "review", preselect: "preselect", skip_to_preinterview: "preinterview",
    skip_to_preselected: "preselect", mark_awaiting_feedback: "await_feedback",
  }[value.command];
  const result = await session.client.rpc("transition_participation", {
    p_participation: value.participationId, p_expected_version: value.version,
    p_command: command, p_reason: "reason" in value ? value.reason ?? null : null,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return { version: result.data };
}
