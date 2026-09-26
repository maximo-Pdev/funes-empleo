import "server-only";
import { getClientEnvironment } from "@/lib/env/client";
import { AppError } from "@/lib/errors/public-error";
export function requireImportOrigin(request: Request) {
  // Next may reconstruct request.url from its internal listening address.
  // Compare against the configured public origin, never an untrusted Host header.
  const expected = new URL(getClientEnvironment().NEXT_PUBLIC_APP_URL).origin;
  if (request.headers.get("origin") !== expected) throw new AppError("ACCESS_DENIED");
}
