import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { databaseUuidSchema } from "@/validation/common";
import { orderContacts } from "./contact-order";

export async function getContactTimeline(participationId: string) {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  if (!databaseUuidSchema.safeParse(participationId).success) throw new AppError("NOT_FOUND");
  const participation = await session.client.from("participations").select("id").eq("id", participationId).maybeSingle();
  if (participation.error) throw new AppError("INTERNAL_ERROR");
  if (!participation.data) throw new AppError("NOT_FOUND");
  // Page through the full timeline instead of silently truncating at PostgREST's row limit.
  const items: ContactItem[] = [];
  for (let offset = 0; ; offset += 200) {
    const result = await session.client.from("contact_events")
      .select("id,channel,direction,occurred_at,summary_internal,next_action_at,recorded_by")
      .eq("participation_id", participationId).order("occurred_at").order("id").range(offset, offset + 199);
    if (result.error) throw new AppError("INTERNAL_ERROR");
    items.push(...result.data);
    if (result.data.length < 200) break;
  }
  return orderContacts(items);
}
export type ContactItem = { id: string; channel: string; direction: string; occurred_at: string;
  summary_internal: string; next_action_at: string | null; recorded_by: string };
