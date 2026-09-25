import "server-only";
import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";

// PostgreSQL accepts all RFC 4122/GUID layouts. Local fixtures intentionally use
// deterministic GUIDs whose version nibble is not v1-v8, so do not impose a
// random-version UUID restriction at the application boundary.
const id = z.guid();
const referralInput = z.object({ participationId: id, expectedVersion: z.number().int().positive(), reason: z.string().trim().max(1_000).optional() });

const categorySchema = z.object({ name: z.string(), kind: z.enum(["occupation", "interest"]) });
const contactSchema = z.object({ kind: z.enum(["email", "phone", "other_approved"]), value: z.string() });
const companyReferralSchema = z.object({
  referralId: id,
  openingId: id,
  openingTitle: z.string().nullable(),
  referredAt: z.iso.datetime({ offset: true }),
  participationVersion: z.number().int().positive().optional(),
  candidate: z.object({
    displayName: z.string(), locality: z.string().nullable(),
    skillsExperienceSummary: z.string().nullable(), availability: z.string().nullable(),
    categories: z.array(categorySchema), contacts: z.array(contactSchema), cvDocumentId: id,
  }).optional(),
  interviews: z.array(z.object({
    id, scheduledAt: z.string().nullable(), heldAt: z.string().nullable(),
    status: z.string(), companyMessage: z.string().nullable(),
  })).optional(),
  feedback: z.array(z.object({
    id, reportedOutcome: z.string(), message: z.string().nullable(),
    reportedAt: z.iso.datetime({ offset: true }), reviewStatus: z.string(),
  })).optional(),
});

export type CompanyReferral = z.infer<typeof companyReferralSchema>;

export async function referCandidate(input: unknown) {
  const parsed = referralInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.role !== "admin" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  const { data, error } = await session.client.rpc("transition_participation", {
    p_participation: parsed.data.participationId,
    p_expected_version: parsed.data.expectedVersion,
    p_command: "refer",
    p_reason: parsed.data.reason ?? null,
  });
  // SQL revalidates current consent, account, profile and exact valid PDF in
  // the same transaction as referral creation, including assisted profiles.
  if (error) throw workflowRpcError(error.message);
  return { version: data };
}

export async function listCompanyReferralReferences(openingId: string) {
  if (!id.safeParse(openingId).success) throw new AppError("NOT_FOUND");
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.role !== "company" || session.account.status !== "active") throw new AppError("NOT_FOUND");
  const { data, error } = await session.client.rpc("company_referral_references", { p_opening: openingId });
  if (error) {
    if (error.message === "NOT_FOUND") throw new AppError("NOT_FOUND");
    throw new AppError("INTERNAL_ERROR");
  }
  return data ?? [];
}

export async function getCompanyReferral(openingId: string, referralId: string): Promise<CompanyReferral> {
  if (!id.safeParse(openingId).success || !id.safeParse(referralId).success) throw new AppError("NOT_FOUND");
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.role !== "company" || session.account.status !== "active") throw new AppError("NOT_FOUND");
  const { data, error } = await session.client.rpc("company_referral", { p_referral: referralId });
  if (error) {
    if (error.message === "NOT_FOUND") throw new AppError("NOT_FOUND");
    throw new AppError("INTERNAL_ERROR");
  }
  const parsed = companyReferralSchema.safeParse(data);
  if (!parsed.success || parsed.data.openingId !== openingId) throw new AppError("NOT_FOUND");
  return parsed.data;
}
