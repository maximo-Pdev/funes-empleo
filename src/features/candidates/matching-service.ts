import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { openingMatchingInput, openingMatchesSchema, openingCandidatePreviewInput, openingCandidatePreviewSchema } from "@/validation/opening-matching";

export async function getOpeningMatches(input: unknown) {
  const parsed = openingMatchingInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  const { openingId, page, pageSize } = parsed.data;
  const result = await session.client.rpc("match_opening_candidates", {
    p_opening: openingId, p_page: page, p_page_size: pageSize,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  const response = openingMatchesSchema.safeParse(result.data);
  if (!response.success) throw new AppError("INTERNAL_ERROR");
  return response.data;
}

export async function getOpeningCandidatePreview(input: unknown) {
  const parsed = openingCandidatePreviewInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  const result = await session.client.rpc("preview_opening_candidate", {
    p_opening: parsed.data.openingId, p_candidate: parsed.data.candidateId,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  const response = openingCandidatePreviewSchema.safeParse(result.data);
  if (!response.success || response.data.id !== parsed.data.candidateId || response.data.openingId !== parsed.data.openingId) {
    throw new AppError("INTERNAL_ERROR");
  }
  return response.data;
}
