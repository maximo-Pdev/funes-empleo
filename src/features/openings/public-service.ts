import "server-only";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/public-error";
import { databaseUuidSchema } from "@/validation/common";

const listInput = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(10) });
const publicSlugSchema = z.string().max(81).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-f0-9]{16}$/);
export interface PublicOffer {
  id: string; slug: string; company_name: string; title: string; tasks: string; requirements: string;
  vacancies: number; location: string; modality: string; schedule: string;
  contract_type: string; closing_date: string; salary: string | null; benefits: string | null;
  categories: { id: string; name: string }[];
}
const publicOfferSchema: z.ZodType<PublicOffer> = z.object({
  id: databaseUuidSchema, slug: publicSlugSchema, company_name: z.string(), title: z.string(), tasks: z.string(),
  requirements: z.string(), vacancies: z.number().int().positive(), location: z.string(),
  modality: z.string(), schedule: z.string(), contract_type: z.string(),
  closing_date: z.string(), salary: z.string().nullable(), benefits: z.string().nullable(),
  categories: z.array(z.object({ id: databaseUuidSchema, name: z.string() })),
});
const responseSchema = z.object({ total: z.number().int().nonnegative(), page: z.number().int(),
  pageSize: z.number().int(), items: z.array(publicOfferSchema) });

export async function listPublicOffers(input: unknown) {
  const parsed = listInput.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const client = await createServerSupabaseClient();
  const result = await client.rpc("published_offers", {
    p_page: parsed.data.page, p_page_size: parsed.data.pageSize,
  });
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const response = responseSchema.safeParse(result.data);
  if (!response.success) throw new AppError("INTERNAL_ERROR");
  return response.data;
}

export async function getPublicOffer(reference: string) {
  const legacyId = databaseUuidSchema.safeParse(reference).success;
  if (!legacyId && !publicSlugSchema.safeParse(reference).success) throw new AppError("NOT_FOUND");
  const client = await createServerSupabaseClient();
  const result = legacyId
    ? await client.rpc("published_offers", { p_page: 1, p_page_size: 1, p_id: reference })
    : await client.rpc("published_offer_by_slug", { p_slug: reference });
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const parsed = responseSchema.safeParse(result.data);
  if (!parsed.success) throw new AppError("INTERNAL_ERROR");
  if (!parsed.data.items[0]) throw new AppError("NOT_FOUND");
  return parsed.data.items[0];
}
