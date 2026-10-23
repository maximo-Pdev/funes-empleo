"use server";

import { recordReference } from "@/lib/records/references";
import { getOpeningCandidatePreview } from "./matching-service";
import { adminActionFailure } from "@/lib/errors/admin-action";
import type { AdminMutationResult } from "@/lib/errors/admin-mutation-result";
import type { OpeningCandidatePreview } from "@/validation/opening-matching";

export async function openingCandidatePreviewAction(input: unknown): Promise<
  Exclude<AdminMutationResult, void> & { profile: (OpeningCandidatePreview & { cvReference: string }) | null }
> {
  try {
    const profile = await getOpeningCandidatePreview(input);
    return { code: "OK", profile: { ...profile, cvReference: await recordReference("cv", profile.cvId) } };
  }
  catch (error) { return { ...adminActionFailure(error), profile: null }; }
}
