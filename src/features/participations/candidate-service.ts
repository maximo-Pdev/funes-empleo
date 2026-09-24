import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { applicationSchema, withdrawalSchema } from "@/validation/application";

async function candidateSession() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "candidate" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  return session;
}
export async function applyToOffer(input: unknown) {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await candidateSession();
  const result = await session.client.rpc("apply_to_opening", {
    p_opening: parsed.data.openingId, p_candidate_version: parsed.data.candidateVersion,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
export async function withdrawParticipation(input: unknown) {
  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await candidateSession();
  const result = await session.client.rpc("transition_participation", {
    p_participation: parsed.data.participationId, p_expected_version: parsed.data.version,
    p_command: "withdraw", p_reason: null,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
export async function listMyParticipations() {
  const session = await candidateSession();
  const result = await session.client.rpc("my_candidate_participations");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return result.data ?? [];
}
