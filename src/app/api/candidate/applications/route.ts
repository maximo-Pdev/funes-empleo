import { revalidatePath } from "next/cache";
import { readAccountSession } from "@/lib/auth/session";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
import { CV_REJECTION_MESSAGE, MAX_CV_BYTES } from "@/lib/files/cv-policy";
import { applyWithOptionalCv, ApplicationCvError } from "@/features/participations/application-cv-service";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    const host = request.headers.get("host");
    const protocol = new URL(request.url).protocol;
    if (!host || !/^(?:\[[0-9a-fA-F:.]+\]|[a-zA-Z0-9.-]+)(?::[0-9]+)?$/.test(host)
      || !["http:", "https:"].includes(protocol)) return false;
    const supplied = new URL(origin);
    return supplied.origin === origin && supplied.origin === new URL(`${protocol}//${host}`).origin;
  } catch { return false; }
}

async function readForm(request: Request) {
  const max = MAX_CV_BYTES + 65536;
  const declared = request.headers.get("content-length");
  if (!request.body || (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > max))) throw new AppError("VALIDATION_ERROR");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > max) { await reader.cancel(); throw new AppError("VALIDATION_ERROR"); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData().catch(() => null);
  if (!form || form.getAll("openingId").length !== 1 || form.getAll("candidateVersion").length !== 1 || form.getAll("cv").length > 1
    || [...form.keys()].some(key => !["openingId", "candidateVersion", "cv"].includes(key))) throw new AppError("VALIDATION_ERROR");
  return form;
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new AppError("ACCESS_DENIED");
    const session = await readAccountSession();
    if (!session) throw new AppError("AUTH_REQUIRED");
    if (session.account.status !== "active" || session.account.role !== "candidate") throw new AppError("ACCESS_DENIED");
    const form = await readForm(request);
    const file = form.get("cv");
    if (file !== null && !(file instanceof File)) throw new AppError("VALIDATION_ERROR");
    await applyWithOptionalCv({ openingId: form.get("openingId"), candidateVersion: form.get("candidateVersion") },
      file instanceof File && (file.name || file.size) ? file : undefined);
    revalidatePath("/account"); revalidatePath("/dashboard");
    return Response.json({ success: true, message: "Postulación recibida por la Oficina de Empleo." }, { headers });
  } catch (error) {
    const result = publicErrorFrom(error);
    const status = result.code === "AUTH_REQUIRED" ? 401 : result.code === "ACCESS_DENIED" ? 403
      : result.code === "CONFLICT_STALE_DATA" ? 409 : result.code === "INTERNAL_ERROR" ? 500 : 422;
    return Response.json({ success: false, message: error instanceof ApplicationCvError ? CV_REJECTION_MESSAGE : result.message,
      ...(error instanceof ApplicationCvError ? { field: "cv" } : {}) }, { status, headers });
  }
}
