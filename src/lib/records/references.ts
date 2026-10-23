import "server-only";
import { cache } from "react";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { databaseIdentifierPattern, isRecordReference, type ReferenceKind } from "./reference-format";

type PendingReference = { id: string; resolve: (reference: string) => void; reject: (error: unknown) => void };
const requestQueue = cache(() => new Map<ReferenceKind, PendingReference[]>());

export async function recordReferences(kind: ReferenceKind, ids: readonly (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)).map(id => id.toLowerCase()))];
  if (!unique.length) return {};
  if (unique.some(id => !databaseIdentifierPattern.test(id))) throw new AppError("NOT_FOUND");
  const session = await readAccountSession();
  if (!session || session.account.status !== "active") throw new AppError("AUTH_REQUIRED");
  const references: Record<string, string> = {};
  for (let offset = 0; offset < unique.length; offset += 1000) {
    const batch = unique.slice(offset, offset + 1000);
    const result = await session.client.rpc("get_record_references", { p_kind: kind, p_ids: batch });
    if (result.error || !result.data || typeof result.data !== "object" || Array.isArray(result.data)) throw new AppError("INTERNAL_ERROR");
    for (const [id, reference] of Object.entries(result.data)) {
      if (!batch.includes(id) || typeof reference !== "string" || !isRecordReference(kind, reference)) throw new AppError("INTERNAL_ERROR");
      references[id] = reference;
    }
  }
  return references;
}

export const recordReference = cache((kind: ReferenceKind, id: string): Promise<string> => new Promise((resolve, reject) => {
  const queue = requestQueue();
  const pending = queue.get(kind);
  if (pending) { pending.push({ id, resolve, reject }); return; }
  const jobs = [{ id, resolve, reject }];
  queue.set(kind, jobs);
  queueMicrotask(async () => {
    queue.delete(kind);
    try {
      const references = await recordReferences(kind, jobs.map(job => job.id));
      for (const job of jobs) {
        if (references[job.id.toLowerCase()]) job.resolve(references[job.id.toLowerCase()]!);
        else job.reject(new AppError("NOT_FOUND"));
      }
    } catch (error) { for (const job of jobs) job.reject(error); }
  });
}));

export async function recordIdentifier(kind: ReferenceKind, reference: string): Promise<string> {
  if (!isRecordReference(kind, reference)) throw new AppError("NOT_FOUND");
  const session = await readAccountSession();
  if (!session || session.account.status !== "active") throw new AppError("AUTH_REQUIRED");
  const result = await session.client.rpc("resolve_record_reference", { p_kind: kind, p_reference: reference });
  if (result.error || typeof result.data !== "string" || !databaseIdentifierPattern.test(result.data)) throw new AppError("NOT_FOUND");
  return result.data;
}

export async function routeIdentifier(kind: ReferenceKind, value: string): Promise<string> {
  if (databaseIdentifierPattern.test(value)) {
    await recordReference(kind, value);
    return value.toLowerCase();
  }
  return recordIdentifier(kind, value);
}
