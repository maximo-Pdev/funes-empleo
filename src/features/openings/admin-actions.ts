"use server";

import { revalidatePath } from "next/cache";
import { adminActionFailure } from "@/lib/errors/admin-action";
import type { AdminMutationResult } from "@/lib/errors/admin-mutation-result";
import { moderateOpening } from "./admin-service";

export async function moderateOpeningAction(input: unknown): Promise<AdminMutationResult> {
  try {
    const result = await moderateOpening(input);
    const openingId = typeof input === "object" && input !== null && "openingId" in input &&
      typeof input.openingId === "string" ? input.openingId : "";
    revalidatePath("/admin/openings");
    revalidatePath("/admin/participations");
    if (openingId) revalidatePath(`/admin/openings/${openingId}`);
    return { code: "OK", ...result };
  } catch (error) { return adminActionFailure(error); }
}
