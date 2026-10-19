import "server-only";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/public-error";
import { databaseUuidSchema } from "@/validation/common";
import { publicOfferSlugSchema } from "@/validation/opening";
import { publicOfferSearchSchema } from "@/validation/public-offer-search";
import { hasPublicOfferFilters } from "./public-search";

export interface PublicOffer {
  id: string; slug: string; company_name: string; title: string; tasks: string; requirements: string;
  vacancies: number; location: string; modality: string; schedule: string;
  contract_type: string; closing_date: string; salary: string | null; benefits: string | null;
  categories: { id: string; name: string }[];
}
const publicOfferSchema: z.ZodType<PublicOffer> = z.object({
  id: databaseUuidSchema, slug: publicOfferSlugSchema, company_name: z.string(), title: z.string(), tasks: z.string(),
  requirements: z.string(), vacancies: z.number().int().positive(), location: z.string(),
  modality: z.string(), schedule: z.string(), contract_type: z.string(),
  closing_date: z.string(), salary: z.string().nullable(), benefits: z.string().nullable(),
  categories: z.array(z.object({ id: databaseUuidSchema, name: z.string() })),
});
const responseSchema = z.object({ total: z.number().int().nonnegative(), page: z.number().int(),
  pageSize: z.number().int(), items: z.array(publicOfferSchema) });

export async function listPublicOffers(input: unknown) {
  const parsed = publicOfferSearchSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const client = await createServerSupabaseClient();
  const filters = parsed.data;
  const pagination = { p_page: filters.page, p_page_size: filters.pageSize };
  const result = hasPublicOfferFilters(filters)
    ? await client.rpc("search_published_offers", { ...pagination, p_q: filters.q, p_rubro: filters.rubro,
      p_localidad: filters.localidad, p_modalidad: filters.modalidad })
    : await client.rpc("published_offers", pagination);
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const response = responseSchema.safeParse(result.data);
  if (!response.success) throw new AppError("INTERNAL_ERROR");
  return response.data;
}

const filterOption = z.object({ value: z.string().min(1), label: z.string().min(1) });
const filterOptionsSchema = z.object({
  categories: z.array(filterOption.extend({ value: z.string().min(1).max(50), label: z.string().min(1).max(150) })),
  localities: z.array(filterOption.extend({ value: z.string().min(1).max(200), label: z.string().min(1).max(200) })),
  modalities: z.array(filterOption.extend({ value: z.string().min(1).max(100), label: z.string().min(1).max(100) })),
});
export type PublicOfferFilterOptions = z.infer<typeof filterOptionsSchema>;
export async function listPublicOfferFilters(): Promise<PublicOfferFilterOptions> {
  const client = await createServerSupabaseClient();
  const result = await client.rpc("public_offer_filter_options");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const response = filterOptionsSchema.safeParse(result.data);
  if (!response.success) throw new AppError("INTERNAL_ERROR");
  return response.data;
}

export async function getPublicOffer(slug: string) {
  if (!publicOfferSlugSchema.safeParse(slug).success) throw new AppError("NOT_FOUND");
  const client = await createServerSupabaseClient();
  const result = await client.rpc("published_offer_by_slug", { p_slug: slug });
  if (result.error) throw new AppError("INTERNAL_ERROR");
  const parsed = responseSchema.safeParse(result.data);
  if (!parsed.success) throw new AppError("INTERNAL_ERROR");
  if (!parsed.data.items[0]) throw new AppError("NOT_FOUND");
  return parsed.data.items[0];
}
