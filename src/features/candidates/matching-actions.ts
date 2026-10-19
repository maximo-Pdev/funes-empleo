"use server";

import { getOpeningCandidatePreview } from "./matching-service";
import { adminActionFailure } from "@/lib/errors/admin-action";
import type { AdminMutationResult } from "@/lib/errors/admin-mutation-result";
import type { OpeningCandidatePreview } from "@/validation/opening-matching";

export async function openingCandidatePreviewAction(input: unknown): Promise<
  Exclude<AdminMutationResult, void> & { profile: OpeningCandidatePreview | null }
> {
  try { return { code: "OK", profile: await getOpeningCandidatePreview(input) }; }
  catch (error) { return { ...adminActionFailure(error), profile: null }; }
}
