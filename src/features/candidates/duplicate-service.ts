import "server-only";
import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { databaseUuidSchema } from "@/validation/common";
import { assistedProfileSchema } from "@/validation/duplicate-resolution";
export const duplicateMatchSchema = z.object({ reviewId: databaseUuidSchema, candidateId: databaseUuidSchema,
  name: z.string(), basis: z.enum(["dni", "email", "both"]), version: z.number().int().positive() });
export type DuplicateMatch = z.infer<typeof duplicateMatchSchema>;
export async function assistedAdminSession() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "admin" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  return session;
}
export async function screenAssistedDuplicates(input: unknown) {
  const parsed = assistedProfileSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await assistedAdminSession();
  const result = await session.client.rpc("screen_assisted_duplicates", { p_dni: parsed.data.dni, p_email: parsed.data.email });
  if (result.error) throw workflowRpcError(result.error.message);
  return z.array(duplicateMatchSchema).parse(result.data);
}
