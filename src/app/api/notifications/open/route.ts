import { openNotification } from "@/features/notifications/service";
import { notificationHeaders, notificationHttpError, notificationSameOrigin } from "@/features/notifications/http";
import { AppError } from "@/lib/errors/public-error";

export async function POST(request: Request) {
  try {
    if (!notificationSameOrigin(request)) throw new AppError("ACCESS_DENIED");
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded") || !request.body) throw new AppError("VALIDATION_ERROR");
    const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 1024) { await reader.cancel(); throw new AppError("VALIDATION_ERROR"); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const params = new URLSearchParams(new TextDecoder().decode(bytes));
    if ([...params.keys()].some(key => key !== "reference") || params.getAll("reference").length !== 1) throw new AppError("VALIDATION_ERROR");
    const href = await openNotification(params.get("reference"));
    return new Response(null, { status: 303, headers: { ...notificationHeaders, Location: href } });
  } catch (error) { return notificationHttpError(error); }
}
