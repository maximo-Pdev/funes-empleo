"use server";

import { revalidatePath } from "next/cache";
import { createAdminNomination } from "./nomination-service";
import { adminActionFailure } from "@/lib/errors/admin-action";
import type { AdminMutationResult } from "@/lib/errors/admin-mutation-result";

export async function createAdminNominationAction(input: unknown): Promise<
  Exclude<AdminMutationResult, void> & { participationId?: string }
> {
  try {
    const participationId = await createAdminNomination(input);
    const candidateId = typeof input === "object" && input !== null && "candidateId" in input
      ? input.candidateId : null;
    revalidatePath("/admin/participations");
    if (typeof candidateId === "string") revalidatePath(`/admin/candidates/${candidateId}`);
    const openingId = typeof input === "object" && input !== null && "openingId" in input ? input.openingId : null;
    if (typeof openingId === "string") revalidatePath(`/admin/openings/${openingId}`);
    return { code: "OK", participationId };
  } catch (error) { return adminActionFailure(error); }
}
