import "server-only";
import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { recordIdentifier } from "@/lib/records/references";
import { isRecordReference } from "@/lib/records/reference-format";
import { databaseUuidSchema } from "@/validation/common";
import { courseLinkSchema, courseReferralSchema } from "@/validation/training";

export type CourseLink = { id: string; title: string; url: string; published: boolean };
export type CourseReferral = { id: string; course_title: string; course_url: string; referred_at: string; referred_by: string };
const courseRow = courseLinkSchema.omit({ courseId: true }).extend({ id: databaseUuidSchema });
async function adminClient() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  return session.client;
}

export async function listCourseLinks(admin = false): Promise<CourseLink[]> {
  const client = admin ? await adminClient() : await createServerSupabaseClient();
  const items: CourseLink[] = [];
  for (let offset = 0; ; offset += 200) {
    let query = client.from("municipal_courses").select("id,title,url,published").order("title").order("id");
    if (!admin) query = query.eq("published", true);
    const result = await query.range(offset, offset + 199);
    if (result.error) throw new AppError("INTERNAL_ERROR");
    const rows = z.array(courseRow).safeParse(result.data);
    if (!rows.success) throw new AppError("INTERNAL_ERROR");
    items.push(...rows.data);
    if (rows.data.length < 200) return items;
  }
}

export async function saveCourseLink(input: unknown) {
  const value = courseLinkSchema.safeParse(input);
  if (!value.success) throw new AppError("VALIDATION_ERROR");
  const client = await adminClient();
  const result = await client.rpc("save_municipal_course", {
    p_title: value.data.title, p_url: value.data.url, p_published: value.data.published, p_course: value.data.courseId ?? null,
  });
  if (result.error) throw workflowRpcError(result.error.message);
}

export async function createCourseReferral(input: unknown) {
  const client = await adminClient();
  const value = courseReferralSchema.safeParse(input);
  if (!value.success) throw new AppError("VALIDATION_ERROR");
  const candidateId = await recordIdentifier("candidate", value.data.candidateReference);
  const result = await client.rpc("create_course_referral", { p_candidate: candidateId, p_course: value.data.courseId });
  if (result.error) throw workflowRpcError(result.error.message);
}

export async function getCourseCandidate(reference: string) {
  const client = await adminClient();
  if (!isRecordReference("candidate", reference)) throw new AppError("NOT_FOUND");
  const id = await recordIdentifier("candidate", reference);
  const result = await client.from("candidate_profiles").select("id,display_name,status,archived_at").eq("id", id).maybeSingle();
  if (result.error) throw new AppError("INTERNAL_ERROR");
  if (!result.data) throw new AppError("NOT_FOUND");
  return result.data;
}

export async function getCourseReferralHistory(candidateId: string, page = 1) {
  const client = await adminClient();
  if (!databaseUuidSchema.safeParse(candidateId).success || !Number.isInteger(page) || page < 1 || page > 100000) throw new AppError("VALIDATION_ERROR");
  const result = await client.from("course_referrals").select("id,course_title,course_url,referred_at,referred_by")
    .eq("candidate_id", candidateId).order("referred_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * 20, page * 20);
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return { items: result.data.slice(0, 20), hasNext: result.data.length > 20 };
}
