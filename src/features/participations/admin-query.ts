import "server-only";
import { z } from "zod";
import { participationStatusSchema } from "@/domain/states";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";

const id = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const listInput = z.object({
  openingId: id.optional(), candidateId: id.optional(), status: participationStatusSchema.optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

async function adminClient() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  return session.client;
}

export async function listAdminParticipations(input: unknown) {
  const parsed = listInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const { openingId, candidateId, status, page, pageSize } = parsed.data;
  const client = await adminClient();
  let query = client.from("participations")
    .select("id,status,origin,created_at,candidate_profiles!participations_candidate_id_fkey(id,display_name),job_openings!participations_opening_id_fkey(id,title)", { count: "exact" })
    .is("archived_at", null).order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (openingId) query = query.eq("opening_id", openingId);
  if (candidateId) query = query.eq("candidate_id", candidateId);
  if (status) query = query.eq("status", status);
  const result = await query;
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const total = result.count ?? 0;
  return { items: result.data ?? [], total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getAdminParticipation(participationId: string) {
  if (!id.safeParse(participationId).success) throw new AppError("NOT_FOUND");
  const client = await adminClient();
  const [participation, audit, preinterviews, contacts, notes, referral] = await Promise.all([
    client.from("participations")
      .select("id,status,origin,version,created_at,feedback_due_at,final_outcome_at,candidate_profiles!participations_candidate_id_fkey(id,display_name),job_openings!participations_opening_id_fkey(id,title,status)")
      .eq("id", participationId).is("archived_at", null).maybeSingle(),
    client.from("audit_events")
      .select("id,action,previous_state,new_state,reason_code,actor_type,actor_account_id,occurred_at")
      .eq("entity_type", "participations").eq("entity_id", participationId)
      .order("occurred_at", { ascending: true }),
    client.from("preinterviews")
      .select("id,channel,scheduled_at,held_at,summary_internal,recommendation,created_at")
      .eq("participation_id", participationId).is("archived_at", null)
      .order("created_at", { ascending: false }),
    client.from("contact_events")
      .select("id,channel,direction,occurred_at,summary_internal,created_at")
      .eq("participation_id", participationId).order("occurred_at", { ascending: false }),
    client.from("internal_notes")
      .select("id,note_kind,body,created_at")
      .eq("participation_id", participationId).is("archived_at", null)
      .order("created_at", { ascending: false }),
    client.from("referrals")
      .select("id,access_status,post_hire_access_until")
      .eq("participation_id", participationId).is("archived_at", null).maybeSingle(),
  ]);
  if ([participation, audit, preinterviews, contacts, notes, referral].some((result) => result.error)) {
    throw new AppError("INTERNAL_ERROR");
  }
  if (!participation.data) throw new AppError("NOT_FOUND");
  const feedback = referral.data ? await client.from("company_feedback")
    .select("id,reported_outcome,reported_at,review_status,message")
    .eq("referral_id", referral.data.id).order("reported_at", { ascending: false }) : null;
  if (feedback?.error) throw new AppError("INTERNAL_ERROR");
  return {
    participation: participation.data,
    audit: audit.data ?? [], preinterviews: preinterviews.data ?? [],
    contacts: contacts.data ?? [], notes: notes.data ?? [],
    referral: referral.data, feedback: feedback?.data ?? [],
  };
}
