import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { persistCandidatePhoto, photoError, photoResult, type PhotoCommand, type PhotoResult } from "./photo-storage";

export async function getCandidatePhoto(candidateId: string): Promise<{ id: string } | null> {
  const session = await readAccountSession();
  if (!session || session.account.status !== 'active') return null;
  const result = await session.client.from('candidate_photos').select('id').eq('candidate_id', candidateId).eq('state', 'current').maybeSingle();
  if (result.error) throw new Error('PHOTO_READ_FAILED');
  return result.data ? { id: result.data.id } : null;
}

// Separate durable signal: removal can leave no current photo while physical erasure needs a retry.
export async function getPhotoCleanupPending(candidateId: string): Promise<boolean> {
  const session = await readAccountSession();
  if (!session || session.account.status !== 'active' || !['candidate', 'admin'].includes(session.account.role)) return false;
  const result = await session.client.rpc('candidate_photo_cleanup_pending', { p_candidate: candidateId });
  if (result.error) throw new Error('PHOTO_CLEANUP_READ_FAILED');
  return result.data === true;
}

export async function changeCandidatePhoto(input: PhotoCommand): Promise<PhotoResult> {
  try {
    const session = await readAccountSession();
    if (!session || session.account.status !== 'active' || session.account.role !== 'candidate') return photoResult('denied');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.candidateId)
      || !Number.isSafeInteger(input.version) || input.version < 1 || input.version > 2147483647
      || !['upload', 'remove', 'cleanup'].includes(input.command)) return photoResult('invalid');
    // Ordinary verified-session RPC checks live session/role/owner/version before decoding or privileged work.
    const authorization = await session.client.rpc('authorize_candidate_photo_mutation', {
      p_candidate: input.candidateId, p_expected_version: input.version,
    });
    if (authorization.error) return photoError(authorization.error);
    if (typeof authorization.data !== "string" || !/^[0-9a-f-]{36}$/i.test(authorization.data)) return photoResult("denied");
    return await persistCandidatePhoto({ ...input, actor: session.account.id, authUser: session.user.id, sessionId: authorization.data });
  } catch (error) { return photoError(error); }
}
