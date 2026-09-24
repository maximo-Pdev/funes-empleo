import { NextResponse } from "next/server";
import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";
import { validatePdf } from "@/lib/files/pdf-validation";
import { getClientEnvironment } from "@/lib/env/client";
import { databaseUuidSchema } from "@/validation/common";

export const dynamic = "force-dynamic";
const versionSchema = z.coerce.number().int().positive();

function result(status: "ok" | "invalid" | "conflict" | "denied", target: string) {
  const url = new URL(target, getClientEnvironment().NEXT_PUBLIC_APP_URL);
  url.searchParams.set("cv", status);
  const response = NextResponse.redirect(url, { status: 303 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  const session = await readAccountSession();
  if (!session || session.account.status !== "active" || !["candidate", "admin"].includes(session.account.role)) {
    return result("denied", "/login");
  }
  const form = await request.formData().catch(() => null);
  const requestedId = form?.get("candidateId");
  const candidateId = typeof requestedId === "string" && databaseUuidSchema.safeParse(requestedId).success ? requestedId : null;
  const version = versionSchema.safeParse(form?.get("version"));
  const destination = session.account.role === "admin" && candidateId ? `/admin/candidates/${candidateId}` : "/candidato/perfil";
  const file = form?.get("cv");
  if (!candidateId || !version.success || !(file instanceof File)) return result("invalid", destination);
  const profile = await session.client.from("candidate_profiles").select("id,account_id,version,archived_at")
    .eq("id", candidateId).maybeSingle();
  if (profile.error || !profile.data || profile.data.archived_at ||
    (session.account.role === "candidate" && profile.data.account_id !== session.account.id)) {
    return result("denied", destination);
  }
  if (profile.data.version !== version.data) return result("conflict", destination);
  // Bound the read before allocating a second copy of an oversized upload.
  if (file.size > 5 * 1024 * 1024 || file.size < 1) return result("invalid", destination);
  const pdf = validatePdf(file.name, file.type, new Uint8Array(await file.arrayBuffer()));
  if (!pdf) return result("invalid", destination);
  const cvId = crypto.randomUUID();
  const path = `${candidateId}/${cvId}.pdf`;
  const args = { p_candidate: candidateId, p_expected_version: version.data, p_cv: cvId,
    p_path: path, p_name: pdf.safeName, p_size: pdf.size, p_sha256: pdf.sha256 };
  const reserved = await session.client.rpc("reserve_candidate_cv", args);
  if (reserved.error) return result(reserved.error.message === "CONFLICT_STALE_DATA" ? "conflict" : "invalid", destination);
  const uploaded = await session.client.storage.from("candidate-cvs").upload(path,
    new Blob([pdf.bytes], { type: "application/pdf" }), { contentType: "application/pdf", upsert: false });
  if (uploaded.error) return result("invalid", destination);
  const committed = await session.client.rpc("commit_candidate_cv", args);
  return result(committed.error ? (committed.error.message === "CONFLICT_STALE_DATA" ? "conflict" : "invalid") : "ok", destination);
}
