import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { MAX_CV_BYTES } from "@/lib/files/cv-policy";
import { normalizeCv } from "@/lib/files/cv-normalization";
import { applicationSchema } from "@/validation/application";
import { applyToOffer } from "./candidate-service";

export class ApplicationCvError extends AppError {
  constructor() { super("VALIDATION_ERROR"); }
}

export async function applyWithOptionalCv(input: unknown, file?: File) {
  if (!file) return applyToOffer(input);
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  if (file.size < 1 || file.size > MAX_CV_BYTES) throw new ApplicationCvError();
  const session = await readAccountSession();
  if (!session || session.account.role !== "candidate" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  const profile = await session.client.from("candidate_profiles").select("id,version")
    .eq("account_id", session.account.id).is("archived_at", null).maybeSingle();
  if (profile.error) throw new AppError("INTERNAL_ERROR");
  if (!profile.data) throw new AppError("NOT_FOUND");
  if (profile.data.version !== parsed.data.candidateVersion) throw new AppError("CONFLICT_STALE_DATA");
  const pdf = await normalizeCv(file.name, file.type, new Uint8Array(await file.arrayBuffer()));
  if (!pdf) throw new ApplicationCvError();
  const cvId = crypto.randomUUID();
  const path = `${profile.data.id}/${cvId}.pdf`;
  const reserved = await session.client.rpc("reserve_application_cv", {
    p_opening: parsed.data.openingId, p_candidate_version: parsed.data.candidateVersion,
    p_cv: cvId, p_path: path, p_name: pdf.safeName, p_size: pdf.size, p_sha256: pdf.sha256,
  });
  if (reserved.error) throw workflowRpcError(reserved.error.message);
  const uploaded = await session.client.storage.from("candidate-cvs").upload(path,
    new Blob([pdf.bytes], { type: "application/pdf" }), { contentType: "application/pdf", upsert: false });
  if (uploaded.error) throw new AppError("INTERNAL_ERROR");
  const result = await session.client.rpc("apply_to_opening_with_cv", {
    p_opening: parsed.data.openingId, p_candidate_version: parsed.data.candidateVersion, p_cv: cvId,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
