"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changeAccountStatus } from "@/features/accounts/service";
import { readAccountSession } from "@/lib/auth/session";
import type { AdminMutationResult } from "@/lib/errors/admin-mutation-result";

const input = z.object({
  resource: z.literal("candidate_account"),
  resourceId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  version: z.number().int().positive(),
  action: z.enum(["suspend", "reactivate", "restore"]),
  reason: z.string().trim().min(1).max(500),
  confirmed: z.literal(true),
});

export async function candidateAccountDecisionAction(payload: unknown): Promise<AdminMutationResult> {
  const parsed = input.safeParse(payload);
  if (!parsed.success) return { code: "INVALID_INPUT" };
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") return { code: "DENIED" };
  const { resourceId, version, action, reason, confirmed } = parsed.data;
  try {
    const target = await session.client.from("accounts").select("role").eq("id", resourceId).maybeSingle();
    if (target.error || target.data?.role !== "candidate") return { code: "DENIED" };
    const result = await changeAccountStatus({ accountId: resourceId, version, command: action, reason, confirmed });
    if (result.code === "CONFLICT_STALE_DATA") return { code: "CONFLICT_STALE_DATA" };
    if (result.code === "INVALID_INPUT") return { code: "INVALID_INPUT" };
    if (result.code !== "OK") return { code: "DENIED" };
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/participations");
    return { code: "OK" };
  } catch {
    return { code: "DENIED" };
  }
}
