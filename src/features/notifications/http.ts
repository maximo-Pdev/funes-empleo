import { publicErrorFrom } from "@/lib/errors/public-error";
export const notificationHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
export function notificationHttpError(error: unknown) {
  const result = publicErrorFrom(error);
  const status = result.code === "AUTH_REQUIRED" ? 401 : result.code === "ACCESS_DENIED" ? 403 : result.code === "NOT_FOUND" ? 404 : result.code === "VALIDATION_ERROR" ? 422 : 500;
  return Response.json({ message: result.message }, { status, headers: notificationHeaders });
}
export function notificationSameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    const host = request.headers.get("host"); const protocol = new URL(request.url).protocol;
    if (!host || !/^(?:\[[0-9a-fA-F:.]+\]|[a-zA-Z0-9.-]+)(?::[0-9]+)?$/.test(host) || !["http:", "https:"].includes(protocol)) return false;
    return new URL(origin).origin === origin && origin === new URL(`${protocol}//${host}`).origin;
  } catch { return false; }
}
