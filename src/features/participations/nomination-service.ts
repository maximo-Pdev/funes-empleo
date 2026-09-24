import "server-only";
import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { databaseUuidSchema } from "@/validation/common";

const nominationInput = z.object({
  candidateId: databaseUuidSchema,
  candidateVersion: z.number().int().positive(),
  openingId: databaseUuidSchema,
  openingVersion: z.number().int().positive(),
});

async function adminClient() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  return session.client;
}

export async function listNominationOpenings() {
  const client = await adminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const result = await client.from("job_openings")
    .select("id,title,version,status,closing_date")
    .is("archived_at", null).in("status", ["published", "paused"])
    .gte("closing_date", today).order("closing_date").limit(200);
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return result.data ?? [];
}

export async function createAdminNomination(input: unknown) {
  const parsed = nominationInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const client = await adminClient();
  const value = parsed.data;
  const result = await client.rpc("create_participation", {
    p_candidate: value.candidateId, p_candidate_version: value.candidateVersion,
    p_opening: value.openingId, p_opening_version: value.openingVersion,
    p_origin: "admin_nomination",
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
