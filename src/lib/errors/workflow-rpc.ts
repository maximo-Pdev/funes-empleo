import { AppError } from "./public-error";

export function workflowRpcError(message: string): AppError {
  switch (message) {
    case "CONFLICT_STALE_DATA": return new AppError("CONFLICT_STALE_DATA");
    case "INVALID_TRANSITION": return new AppError("INVALID_TRANSITION");
    case "INVALID_INPUT": return new AppError("VALIDATION_ERROR");
    case "CONSENT_REQUIRED": return new AppError("CONSENT_REQUIRED");
    case "VALID_CV_REQUIRED": return new AppError("VALID_CV_REQUIRED");
    case "NOT_FOUND": return new AppError("NOT_FOUND");
    case "FORBIDDEN": return new AppError("ACCESS_DENIED");
    case "AUTH_REQUIRED": return new AppError("AUTH_REQUIRED");
    default: return new AppError("INTERNAL_ERROR");
  }
}
