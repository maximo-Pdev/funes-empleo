import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getClientEnvironment } from "@/lib/env/client";
import { getServerEnvironment } from "@/lib/env/server";
import { MAX_PHOTO_BYTES, normalizeCandidatePhoto } from "@/lib/files/image-validation";
import type { Database } from "@/lib/supabase/database.types";

export type PhotoStatus = "ok" | "invalid" | "conflict" | "denied" | "error" | "cleanup_pending";
export type PhotoResult = { status: PhotoStatus; message: string };
export type PhotoCommand = { candidateId: string; version: number; command: "upload" | "remove" | "cleanup"; photo?: File };
const messages: Record<PhotoStatus, string> = {
  ok: "El cambio de foto se guardó y se completó el borrado pendiente.",
  invalid: "Usá una imagen JPEG o PNG de hasta 5 MiB y 16 megapíxeles, sin animación.",
  conflict: "El perfil cambió. Actualizá la página y volvé a intentarlo.",
  denied: "No tenés permiso para modificar esta foto.",
  error: "No se pudo guardar la foto. Volvé a intentarlo.",
  cleanup_pending: "El cambio se guardó, pero queda pendiente borrar el archivo anterior. Reintentá el borrado.",
};
export function photoResult(status: PhotoStatus): PhotoResult { return { status, message: messages[status] }; }
export function photoError(error: unknown): PhotoResult {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  return photoResult(message.includes('CONFLICT_STALE_DATA') ? 'conflict'
    : /NOT_FOUND|FORBIDDEN|AUTH_REQUIRED/.test(message) ? 'denied'
    : /INVALID_PHOTO|INVALID_INPUT/.test(message) ? 'invalid' : 'error');
}

// This module never exports a privileged client, arbitrary path operations or unvalidated ingestion.
// Only server-verified identities reach it; every privileged RPC revalidates the actor in the database.
export async function persistCandidatePhoto(input: PhotoCommand & { actor: string; authUser: string; sessionId: string }): Promise<PhotoResult> {
  let normalized: Awaited<ReturnType<typeof normalizeCandidatePhoto>> | undefined;
  if (input.command === 'upload') {
    if (!input.photo || input.photo.size > MAX_PHOTO_BYTES || input.photo.size < 1) return photoResult('invalid');
    try { normalized = await normalizeCandidatePhoto(new Uint8Array(await input.photo.arrayBuffer())); }
    catch { return photoResult('invalid'); }
  }
  const { SUPABASE_SECRET_KEY } = getServerEnvironment();
  if (!SUPABASE_SECRET_KEY) return photoResult('error');
  const client = createClient<Database>(getClientEnvironment().NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const identity = { p_actor: input.actor, p_auth_user: input.authUser, p_session: input.sessionId, p_candidate: input.candidateId };
  const photoId = randomUUID();
  const mutation = { ...identity, p_expected_version: input.version, p_photo: photoId,
    p_size: normalized?.size ?? 0, p_sha256: normalized?.sha256 ?? '' };
  async function cleanup() {
    try {
      const queued = await client.rpc('candidate_photo_cleanup', identity);
      if (queued.error || !queued.data) return false;
      let complete = true;
      for (const old of queued.data) {
        // SQL only returns irrevocably noncurrent objects. Keys are immutable and never reused.
        const deleted = await client.storage.from('candidate-photos').remove([old.storage_path]);
        if (deleted.error) { complete = false; continue; }
        const acknowledged = await client.rpc('complete_candidate_photo_cleanup', { ...identity, p_photo: old.id });
        if (acknowledged.error) complete = false;
      }
      return complete;
    } catch { return false; }
  }
  if (input.command === "cleanup") return photoResult(await cleanup() ? "ok" : "cleanup_pending");
  let prepared = false;
  try {
    if (normalized) {
      const reservation = await client.rpc('ingest_candidate_photo', { ...mutation, p_command: 'prepare' });
      if (reservation.error) throw reservation.error;
      prepared = true;
      const uploaded = await client.storage.from('candidate-photos').upload(`${input.candidateId}/${photoId}.webp`, normalized.bytes,
        { contentType: 'image/webp', upsert: false, cacheControl: '0' });
      if (uploaded.error) throw uploaded.error;
    }
    const committed = await client.rpc('ingest_candidate_photo', { ...mutation, p_command: normalized ? 'commit' : 'remove' });
    if (committed.error) throw committed.error;
    return photoResult(await cleanup() ? 'ok' : 'cleanup_pending');
  } catch (error) {
    if (prepared) {
      try { await client.rpc('ingest_candidate_photo', { ...mutation, p_command: 'abort' }); await cleanup(); }
      catch { /* The durable pending row is reclaimed by a subsequent authorized retry. */ }
    }
    return photoError(error);
  }
}
