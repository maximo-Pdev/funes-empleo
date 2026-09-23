import "server-only";
import { z } from "zod";
import { openingStatusSchema } from "@/domain/states";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";

const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const listInput = z.object({
  status: openingStatusSchema.optional(),
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

export async function listAdminOpenings(input: unknown) {
  const parsed = listInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const { status, page, pageSize } = parsed.data;
  const client = await adminClient();
  let query = client.from("job_openings")
    .select("id,title,status,closing_date,version,created_at,company_profiles!job_openings_company_id_fkey(legal_name)", { count: "exact" })
    .is("archived_at", null).order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (status) query = query.eq("status", status);
  const result = await query;
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const total = result.count ?? 0;
  return { items: result.data ?? [], total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getAdminOpening(openingId: string) {
  const parsed = idSchema.safeParse(openingId);
  if (!parsed.success) throw new AppError("NOT_FOUND");
  const client = await adminClient();
  const [opening, events] = await Promise.all([
    client.from("job_openings")
      .select("id,title,tasks,requirements,vacancies,location,modality,schedule,contract_type,closing_date,status,version,moderation_message_public,company_profiles!job_openings_company_id_fkey(id,legal_name,status)")
      .eq("id", parsed.data).is("archived_at", null).maybeSingle(),
    client.from("opening_moderation_events")
      .select("id,decision,previous_status,new_status,company_message,internal_reason,actor_type,actor_account_id,created_at")
      .eq("opening_id", parsed.data).order("created_at", { ascending: false }),
  ]);
  if (opening.error || events.error) throw new AppError("INTERNAL_ERROR");
  if (!opening.data) throw new AppError("NOT_FOUND");
  return { opening: opening.data, events: events.data ?? [] };
}
