import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { databaseUuidSchema } from "@/validation/common";
import { assistedProfileSchema, duplicateResolutionSchema } from "@/validation/duplicate-resolution";
import { assistedAdminSession, duplicateMatchSchema } from "./duplicate-service";
const saveSchema = z.object({ candidateId: databaseUuidSchema.nullable(), version: z.coerce.number().int().positive().nullable(),
  data: assistedProfileSchema, resolution: duplicateResolutionSchema.nullable() });
export const assistedResultSchema = z.object({ status: z.enum(["saved", "duplicates", "rejected"]),
  candidateId: databaseUuidSchema.optional(), matches: z.array(duplicateMatchSchema).optional() });
export async function saveAssistedCandidate(input: unknown) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await assistedAdminSession();
  const { candidateId, version, data, resolution } = parsed.data;
  const result = await session.client.rpc("save_assisted_candidate", { p_candidate: candidateId, p_expected_version: version,
    p_data: data, p_review: resolution?.reviewId ?? null, p_decision: resolution?.decision ?? null,
    p_reason: resolution?.reason ?? null, p_fields: resolution?.confirmedFields ?? [] });
  if (result.error) throw workflowRpcError(result.error.message);
  return assistedResultSchema.parse(result.data);
}
export async function getAssistedWorkspace(candidateId?: string) {
  const session = await assistedAdminSession();
  const categories = await session.client.from("job_categories").select("id,name,code").eq("active", true).order("name");
  if (categories.error) throw new AppError("INTERNAL_ERROR");
  if (!candidateId) return { categories: categories.data, workspace: null };
  if (!databaseUuidSchema.safeParse(candidateId).success) throw new AppError("NOT_FOUND");
  const [profile, personal, contacts, selected, policy, consent, requests] = await Promise.all([
    session.client.from("candidate_profiles").select("id,display_name,origin,account_id,locality,skills_experience_summary,availability,availability_detail,status,version").eq("id", candidateId).is("archived_at", null).maybeSingle(),
    session.client.from("candidate_private_data").select("dni_display,address").eq("candidate_id", candidateId).maybeSingle(),
    session.client.from("candidate_contacts").select("kind,value").eq("candidate_id", candidateId).eq("is_primary", true).is("archived_at", null),
    session.client.from("candidate_categories").select("category_id,kind").eq("candidate_id", candidateId),
    session.client.rpc("candidate_consent_policy"),
    session.client.from("candidate_consents").select("status").eq("candidate_id", candidateId).order("recorded_at", { ascending: false }).order("id", { ascending: false }).limit(1),
    session.client.rpc("assisted_claim_requests", { p_candidate: candidateId }),
  ]);
  if (!profile.data || !personal.data) throw new AppError("NOT_FOUND");
  if ([profile, personal, contacts, selected, policy, consent, requests].some((r) => r.error) || !policy.data?.[0]) throw new AppError("INTERNAL_ERROR");
  const p = profile.data;
  return { categories: categories.data, workspace: { profile: p, data: {
    name: p.display_name, dni: personal.data.dni_display, address: personal.data.address ?? "", locality: p.locality ?? "",
    summary: p.skills_experience_summary ?? "", availability: p.availability === "unavailable" ? "unavailable" as const : "available" as const,
    detail: p.availability_detail ?? "", phone: contacts.data?.find((c) => c.kind === "phone")?.value ?? "",
    email: contacts.data?.find((c) => c.kind === "email")?.value ?? "",
    categories: selected.data?.filter((c) => c.kind === "occupation").map((c) => c.category_id) ?? [],
    interests: selected.data?.filter((c) => c.kind === "interest").map((c) => c.category_id) ?? [],
  }, policy: policy.data[0], consent: consent.data?.[0]?.status,
  requests: z.array(z.object({ accountId: databaseUuidSchema, email: z.string(), verified: z.boolean() })).parse(requests.data) } };
}
