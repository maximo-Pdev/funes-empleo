"use server";

import { publicErrorFrom } from "@/lib/errors/public-error";
import { getAdminCandidateHistory } from "./search-service";
import type { CandidateHistoryResult } from "./candidate-history";

export async function loadCandidateHistoryAction(input: unknown): Promise<CandidateHistoryResult> {
  try { return { success: true, page: await getAdminCandidateHistory(input) }; }
  catch (error) { return { success: false, message: publicErrorFrom(error).message }; }
}
