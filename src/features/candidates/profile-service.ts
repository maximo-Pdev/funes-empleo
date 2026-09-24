import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { bootstrapCandidate } from "./registration-service";
import { candidateProfileSchema, phoneSchema, candidateVersionSchema, candidateArchiveSchema } from "@/validation/candidate-profile";
import { changeAccountStatus } from "@/features/accounts/service";

async function candidateSession() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "candidate" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  return session;
}

export async function getCandidateWorkspace() {
  const session = await candidateSession();
  const bootstrap = await bootstrapCandidate();
  if (bootstrap !== "ready") return { bootstrap, profile: null } as const;
  const profileResult = await session.client.from("candidate_profiles")
    .select("id,display_name,locality,skills_experience_summary,availability,availability_detail,status,last_confirmed_at,refresh_due_at,version")
    .eq("account_id", session.account.id).maybeSingle();
  if (profileResult.error || !profileResult.data) throw new AppError("INTERNAL_ERROR");
  const profileId = profileResult.data.id;
  const freshness = await session.client.rpc("refresh_candidate_freshness", { p_candidate: profileId });
  if (freshness.error) throw workflowRpcError(freshness.error.message);
  const [profile, privateData, contacts, categories, allCategories, consents, cvs] = await Promise.all([
    session.client.from("candidate_profiles").select("id,display_name,locality,skills_experience_summary,availability,availability_detail,status,last_confirmed_at,refresh_due_at,version")
      .eq("id", profileId).single(),
    session.client.from("candidate_private_data").select("dni_display,address").eq("candidate_id", profileId).single(),
    session.client.from("candidate_contacts").select("id,kind,value,verified_at")
      .eq("candidate_id", profileId).is("archived_at", null).order("created_at"),
    session.client.from("candidate_categories").select("category_id,kind").eq("candidate_id", profileId),
    session.client.from("job_categories").select("id,name,code").eq("active", true).order("name"),
    session.client.from("candidate_consents").select("id,status,policy_version,recorded_at")
      .eq("candidate_id", profileId).order("recorded_at", { ascending: false }).order("id", { ascending: false }).limit(1),
    session.client.from("cv_documents").select("id,original_name_safe,byte_size,created_at")
      .eq("candidate_id", profileId).eq("status", "valid").is("archived_at", null).maybeSingle(),
  ]);
  if ([profile, privateData, contacts, categories, allCategories, consents, cvs].some((item) => item.error) || !profile.data || !privateData.data) {
    throw new AppError("INTERNAL_ERROR");
  }
  return { bootstrap: "ready" as const, profile: profile.data, privateData: privateData.data,
    contacts: contacts.data ?? [], categories: categories.data ?? [], allCategories: allCategories.data ?? [],
    consent: consents.data?.[0] ?? null, cv: cvs.data ?? null, account: session.account };
}

export async function saveCandidateProfile(input: unknown) {
  const parsed = candidateProfileSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await candidateSession();
  const value = parsed.data;
  const result = await session.client.rpc("save_candidate_profile", {
    p_expected_version: value.version, p_name: value.name, p_dni: value.dni,
    p_locality: value.locality, p_summary: value.summary, p_availability: value.availability,
    p_detail: value.detail, p_address: value.address, p_categories: value.categories,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}

export async function setCandidatePhone(input: unknown) {
  const parsed = phoneSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await candidateSession();
  const result = await session.client.rpc("set_candidate_phone", {
    p_expected_version: parsed.data.version, p_phone: parsed.data.phone,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}

export async function activateCandidate(input: unknown) {
  const parsed = candidateVersionSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await candidateSession();
  const result = await session.client.rpc("activate_candidate", { p_expected_version: parsed.data.version });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}

export async function archiveCandidate(input: unknown) {
  const parsed = candidateArchiveSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await candidateSession();
  const result = await changeAccountStatus({ accountId: session.account.id,
    version: parsed.data.version, command: "archive", reason: "", confirmed: true });
  if (result.code !== "OK") throw new AppError(result.code === "CONFLICT_STALE_DATA" ? "CONFLICT_STALE_DATA" : "INVALID_TRANSITION");
}
