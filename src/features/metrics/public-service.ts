import "server-only";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/public-error";

const countsSchema = z.object({
  candidates: z.number().int().nonnegative(),
  companies: z.number().int().nonnegative(),
  offers: z.number().int().nonnegative(),
}).strict();

export type PublicPortalCounts = z.infer<typeof countsSchema>;

export async function getPublicPortalCounts(): Promise<PublicPortalCounts> {
  const client = await createServerSupabaseClient();
  const result = await client.rpc("public_portal_counts");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const parsed = countsSchema.safeParse(result.data);
  if (!parsed.success) throw new AppError("INTERNAL_ERROR");
  return parsed.data;
}
