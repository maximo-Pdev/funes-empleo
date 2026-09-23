import { publicErrorMessage, type PublicErrorCode } from "./codes";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AppError extends Error {
  readonly code: PublicErrorCode;

  constructor(code: PublicErrorCode) {
    super(code);
    this.name = "AppError";
    this.code = code;
  }
}

export interface PublicError {
  code: PublicErrorCode;
  message: string;
  requestId?: string;
}

// Only errors created with an approved code can be translated. Unknown errors,
// including database and authentication-provider errors, remain generic.
export function publicErrorFrom(error: unknown, requestId?: string): PublicError {
  const code = error instanceof AppError ? error.code : "INTERNAL_ERROR";
  const result: PublicError = { code, message: publicErrorMessage(code) };
  if (requestId && UUID_PATTERN.test(requestId)) result.requestId = requestId;
  return result;
}
