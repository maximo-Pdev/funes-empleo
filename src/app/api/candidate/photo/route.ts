import { changeCandidatePhoto } from "@/features/candidates/photo-service";
import { photoResult, type PhotoStatus } from "@/features/candidates/photo-storage";
import { MAX_PHOTO_BYTES } from "@/lib/files/image-validation";
export const runtime = 'nodejs';
const httpStatus: Record<PhotoStatus, number> = { ok: 200, invalid: 422, conflict: 409, denied: 403, error: 500, cleanup_pending: 503 };
export async function POST(request: Request) {
  const reply = (result: ReturnType<typeof photoResult>) => Response.json(result, {
    status: httpStatus[result.status], headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
  const origin = request.headers.get('origin');
  if (origin !== null) {
    try {
      // Next may use an internal localhost URL. Host is the actual request authority;
      // forwarded headers are untrusted and must never authorize an Origin.
      const host = request.headers.get('host');
      const protocol = new URL(request.url).protocol;
      if (!host || !/^(?:\[[0-9a-fA-F:.]+\]|[a-zA-Z0-9.-]+)(?::[0-9]+)?$/.test(host)
        || (protocol !== 'http:' && protocol !== 'https:')) return reply(photoResult('denied'));
      const expected = new URL(`${protocol}//${host}`).origin;
      const supplied = new URL(origin);
      // Origin is a serialized origin, not a URL with credentials/path/query.
      if (supplied.origin !== origin || supplied.origin !== expected) return reply(photoResult('denied'));
    } catch { return reply(photoResult('denied')); }
  }
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_PHOTO_BYTES + 65536)) return reply(photoResult('invalid'));
  try {
    if (!request.body) return reply(photoResult('invalid'));
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > MAX_PHOTO_BYTES + 65536) { await reader.cancel(); return reply(photoResult('invalid')); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const form = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData();
    const candidateId = form.get('candidateId'); const version = form.get('version'); const command = form.get('command');
    const photo = form.get('photo');
    if (typeof candidateId !== 'string' || typeof version !== 'string' || !/^[1-9]\d*$/.test(version)
      || !Number.isSafeInteger(Number(version)) || Number(version) > 2147483647
      || (command !== 'upload' && command !== 'remove' && command !== 'cleanup')
      || (command === 'upload' && (!(photo instanceof File) || photo.size < 1 || photo.size > MAX_PHOTO_BYTES))) return reply(photoResult('invalid'));
    return reply(await changeCandidatePhoto({ candidateId, version: Number(version), command, photo: photo instanceof File ? photo : undefined }));
  } catch { return reply(photoResult('invalid')); }
}
