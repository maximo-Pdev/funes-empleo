import { AppError } from "./public-error";
import type { AdminMutationResult } from "./admin-mutation-result";

export function adminActionFailure(error: unknown): Exclude<AdminMutationResult, void> {
  return { code: error instanceof AppError ? error.code : "INTERNAL_ERROR" };
}
