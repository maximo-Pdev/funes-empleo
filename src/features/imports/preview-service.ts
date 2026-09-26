import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { assistedAdminSession } from "@/features/candidates/duplicate-service";
import { getServerEnvironment } from "@/lib/env/server";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { databaseUuidSchema } from "@/validation/common";
import { importConfirmationSchema, importResolutionSchema } from "@/validation/candidate-import";
import { IMPORT_LIMITS, IMPORT_MAPPING } from "./mapping";
import { parseCandidateCsv } from "./parser";

export const previewSchema = z.object({ id: databaseUuidSchema, version: z.number(), hash: z.string(), mapping: z.string(),
  status: z.string(), total: z.number(), valid: z.number(), invalid: z.number(), duplicates: z.number(),
  failure: z.string().nullable(), retryOf: z.string().nullable(), rows: z.array(z.object({ id: databaseUuidSchema,
    number: z.number(), status: z.string(), errors: z.array(z.string()), decision: z.string().nullable(),
    fields: z.array(z.string()), locality: z.string().nullable(), summary: z.string().nullable(),
    categories: z.array(z.string()), availability: z.string().nullable(),
    name: z.string().nullable(), dni: z.string().nullable(), email: z.string(), phone: z.string(),
    matches: z.array(z.object({ id: databaseUuidSchema, name: z.string(), version: z.number() })) })) });
export type ImportPreview = z.infer<typeof previewSchema>;
export async function importSession() {
  getServerEnvironment(); // Fails closed unless local/preview/demo is explicitly configured.
  return assistedAdminSession();
}
export async function readBoundedCsv(body: ReadableStream<Uint8Array> | null, maxBytes: number = IMPORT_LIMITS.bytes) {
  if (!body) throw new AppError("VALIDATION_ERROR");
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new AppError("VALIDATION_ERROR"); }
      chunks.push(part.value);
    }
    return Buffer.concat(chunks);
  } finally { reader.releaseLock(); }
}
export async function previewImport(bytes: Uint8Array, retry: string | null) {
  const session = await importSession();
  if (retry && !databaseUuidSchema.safeParse(retry).success) throw new AppError("VALIDATION_ERROR");
  let rows;
  try { rows = await parseCandidateCsv(bytes); } catch { throw new AppError("VALIDATION_ERROR"); }
  const result = await session.client.rpc("preview_candidate_import", { p_hash: createHash("sha256").update(bytes).digest("hex"),
    p_mapping: IMPORT_MAPPING, p_rows: rows, p_retry: retry });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
export async function getImportPreview(id: string) {
  const session = await importSession();
  if (!databaseUuidSchema.safeParse(id).success) throw new AppError("NOT_FOUND");
  const result = await session.client.rpc("import_batch_preview", { p_batch: id });
  if (result.error) throw workflowRpcError(result.error.message);
  return previewSchema.parse(result.data);
}
export async function resolveImport(input: unknown) {
  const session = await importSession();
  const parsed = importResolutionSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const p = parsed.data;
  const result = await session.client.rpc("resolve_import_row", { p_batch: p.batchId, p_version: p.version, p_row: p.rowId,
    p_decision: p.decision, p_reason: p.reason, p_data: p.data, p_candidate: p.candidateId,
    p_candidate_version: p.candidateVersion, p_fields: p.fields });
  if (result.error) throw workflowRpcError(result.error.message);
  return getImportPreview(p.batchId);
}
export async function confirmImport(id: string, input: unknown) {
  const session = await importSession();
  const parsed = importConfirmationSchema.safeParse(input);
  if (!databaseUuidSchema.safeParse(id).success || !parsed.success) throw new AppError("VALIDATION_ERROR");
  const result = await session.client.rpc("confirm_candidate_import", { p_batch: id, p_version: parsed.data.version,
    p_hash: parsed.data.hash, p_mapping: parsed.data.mapping });
  if (result.error) throw workflowRpcError(result.error.message);
  return getImportPreview(id);
}
export async function listImports() {
  const session = await importSession();
  const result = await session.client.from("import_batches").select("id,status,total_rows,created_at,retry_of_batch_id")
    .order("created_at", { ascending: false }).limit(50);
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return result.data;
}
