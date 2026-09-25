import "server-only";
import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { referralEligibility } from "@/domain/permissions/referral";
import { candidateSearchSchema, type CandidateSearchFilters } from "@/validation/candidate-search";

// PostgreSQL UUIDs in the deterministic local fixture are MD5-derived and do
// not necessarily carry RFC version bits.
const candidateIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

type ConsentSnapshot = { id: string; status: "accepted" | "withdrawn"; recorded_at: string };
type CvSnapshot = { status: string; archived_at: string | null };
type CategorySnapshot = { category_id: string; job_categories: { code: string; name: string; active: boolean } | null };

export interface CandidateSearchRow {
  id: string;
  account_id: string | null;
  display_name: string;
  locality: string | null;
  skills_experience_summary: string | null;
  availability: string | null;
  status: string;
  refresh_due_at: string | null;
  archived_at: string | null;
  version: number;
  accounts: { status: string } | null;
  candidate_categories: CategorySnapshot[];
  candidate_consents: ConsentSnapshot[];
  cv_documents: CvSnapshot[];
}

export interface CandidateSearchHit {
  id: string;
  displayName: string;
  locality: string | null;
  skills: string | null;
  availability: string | null;
  status: string;
  refreshDueAt: string | null;
  version: number;
  categories: { code: string; name: string }[];
  referralEligible: boolean;
}

export function candidateIsReferralEligible(row: Pick<CandidateSearchRow,
  "account_id" | "status" | "availability" | "archived_at" | "refresh_due_at" | "accounts" | "candidate_consents" | "cv_documents">,
now: Date): boolean {
  const latestConsent = [...row.candidate_consents].sort((a, b) =>
    b.recorded_at.localeCompare(a.recorded_at) || b.id.localeCompare(a.id))[0];
  return referralEligibility({ status: row.status, available: row.availability === "available", archived: Boolean(row.archived_at),
    fresh: Boolean(row.refresh_due_at && new Date(row.refresh_due_at).getTime() > now.getTime()),
    accountActive: !row.account_id || row.accounts?.status === "active", currentConsent: latestConsent?.status === "accepted",
    validCv: row.cv_documents.some((document) => document.status === "valid" && !document.archived_at) }) === null;
}

export function paginateCandidates<T>(items: readonly T[], page: number, pageSize: number) {
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize,
    pageCount: Math.ceil(total / pageSize) };
}

async function adminClient() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  return session.client;
}

async function refreshDueProfiles(client: Awaited<ReturnType<typeof adminClient>>, candidateId?: string) {
  const result = await client.rpc("refresh_candidate_freshness", { p_candidate: candidateId });
  if (result.error) throw new AppError("INTERNAL_ERROR");
}

const SEARCH_COLUMNS = "id,account_id,display_name,locality,skills_experience_summary,availability,status,refresh_due_at,archived_at,version,accounts!candidate_profiles_account_id_fkey(status),candidate_categories(category_id,job_categories(code,name,active)),candidate_consents(id,status,recorded_at),cv_documents(status,archived_at)";
const BATCH_SIZE = 1000;

// The bounded demonstration fixture fits in one request. Apply category and
// eligibility against joined rows: sending hundreds of candidate UUIDs through
// a PostgREST `in` URL can exceed the API/proxy request-line limit.
export async function searchCandidates(input: unknown, now = new Date()) {
  const parsed = candidateSearchSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const filters: CandidateSearchFilters = parsed.data;
  const client = await adminClient();
  await refreshDueProfiles(client);
  const matches: CandidateSearchHit[] = [];
  for (let offset = 0; ; offset += BATCH_SIZE) {
    let query = client.from("candidate_profiles").select(SEARCH_COLUMNS)
      .order("display_name").order("id")
      .range(offset, offset + BATCH_SIZE - 1);
    if (filters.vigency !== "all") query = query.is("archived_at", null);
    if (filters.term) {
      const pattern = `%${filters.term}%`;
      query = query.or(`display_name.ilike.${pattern},skills_experience_summary.ilike.${pattern}`);
    }
    if (filters.skills) query = query.ilike("skills_experience_summary", `%${filters.skills}%`);
    if (filters.availability) query = query.ilike("availability", `%${filters.availability}%`);
    if (filters.locality) query = query.ilike("locality", `%${filters.locality}%`);
    if (filters.vigency === "current" || filters.eligibility === "eligible") {
      query = query.eq("status", "active").gt("refresh_due_at", now.toISOString());
    } else if (filters.vigency === "needs_update") {
      query = query.in("status", ["active", "needs_update"])
        .or(`status.eq.needs_update,refresh_due_at.lte.${now.toISOString()}`);
    }
    const result = await query;
    if (result.error) throw new AppError("INTERNAL_ERROR");
    const rows = (result.data ?? []) as unknown as CandidateSearchRow[];
    for (const row of rows) {
      if (filters.categoryId && !row.candidate_categories.some((entry) => entry.category_id === filters.categoryId)) continue;
      const eligible = candidateIsReferralEligible(row, now);
      if (filters.eligibility === "eligible" && !eligible) continue;
      if (filters.eligibility === "ineligible" && eligible) continue;
      matches.push({
        id: row.id, displayName: row.display_name, locality: row.locality,
        skills: row.skills_experience_summary, availability: row.availability,
        status: row.status, refreshDueAt: row.refresh_due_at, version: row.version,
        categories: row.candidate_categories.filter((entry) => entry.job_categories?.active)
          .map((entry) => ({ code: entry.job_categories!.code, name: entry.job_categories!.name })),
        referralEligible: eligible,
      });
    }
    if (rows.length < BATCH_SIZE) break;
  }
  return paginateCandidates(matches, filters.page, filters.pageSize);
}

export async function listCandidateSearchCategories() {
  const client = await adminClient();
  const result = await client.from("job_categories").select("id,code,name")
    .eq("active", true).order("name");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return result.data ?? [];
}

export async function getAdminCandidate(candidateId: string) {
  const parsed = candidateIdSchema.safeParse(candidateId);
  if (!parsed.success || !parsed.data) throw new AppError("NOT_FOUND");
  const client = await adminClient();
  await refreshDueProfiles(client, parsed.data);
  const [candidate, participations, notes] = await Promise.all([
    client.from("candidate_profiles")
      .select("id,account_id,display_name,locality,skills_experience_summary,availability,status,refresh_due_at,version,accounts!candidate_profiles_account_id_fkey(id,status,version),candidate_categories(job_categories(code,name)),candidate_consents(id,status,recorded_at),cv_documents(status,archived_at)")
      .eq("id", parsed.data).maybeSingle(),
    client.from("participations")
      .select("id,status,origin,created_at,job_openings!participations_opening_id_fkey(id,title)")
      .eq("candidate_id", parsed.data).is("archived_at", null).order("created_at", { ascending: false }).limit(50),
    client.from("internal_notes")
      .select("id,note_kind,body,created_at")
      .eq("candidate_id", parsed.data).is("archived_at", null)
      .is("participation_id", null).order("created_at", { ascending: false }).limit(50),
  ]);
  if (candidate.error || participations.error || notes.error) throw new AppError("INTERNAL_ERROR");
  if (!candidate.data) throw new AppError("NOT_FOUND");
  const row = candidate.data as unknown as CandidateSearchRow;
  const entityIds = candidate.data.account_id ? [candidate.data.id, candidate.data.account_id] : [candidate.data.id];
  const audit = await client.from("audit_events")
    .select("id,entity_type,action,previous_state,new_state,reason_code,actor_type,actor_account_id,occurred_at")
    .in("entity_id", entityIds).in("entity_type", ["candidate_profiles", "accounts"])
    .order("occurred_at", { ascending: false }).limit(50);
  if (audit.error) throw new AppError("INTERNAL_ERROR");
  return { candidate: candidate.data, referralEligible: candidateIsReferralEligible(row, new Date()),
    participations: participations.data ?? [], notes: notes.data ?? [], audit: audit.data ?? [] };
}
