import "server-only";
import { z } from "zod";
import { companySession, getCompanyWorkspace } from "@/features/companies/service";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { openingDraftSchema, openingSubmitSchema } from "@/validation/opening";
import { databaseUuidSchema } from "@/validation/common";

const offerShape = z.object({
  id: z.string(), title: z.string().nullable(), tasks: z.string().nullable(), requirements: z.string().nullable(),
  vacancies: z.number().nullable(), location: z.string().nullable(), modality: z.string().nullable(),
  schedule: z.string().nullable(), contract_type: z.string().nullable(), closingDate: z.string().nullable(),
  salary: z.string().nullable(), benefits: z.string().nullable(), status: z.string(), version: z.number(),
  createdAt: z.string(), categories: z.array(z.object({ id: z.string(), name: z.string() })),
  history: z.array(z.object({ decision: z.string(), previousStatus: z.string().nullable(), newStatus: z.string(),
    message: z.string().nullable(), at: z.string() })),
});
export type CompanyOffer = z.infer<typeof offerShape>;
const listShape = z.object({ total: z.number(), page: z.number(), pageSize: z.number(), items: z.array(offerShape) });

export async function listCompanyOffers(page = 1, id?: string) {
  if (id && !databaseUuidSchema.safeParse(id).success) throw new AppError("NOT_FOUND");
  const session = await companySession();
  await getCompanyWorkspace();
  const result = await session.client.rpc("my_company_offers", { p_page: page, p_page_size: 10, p_id: id ?? null });
  if (result.error) throw workflowRpcError(result.error.message);
  const parsed = listShape.safeParse(result.data);
  if (!parsed.success) throw new AppError("INTERNAL_ERROR");
  return parsed.data;
}

export async function listCompanyCategories() {
  const session = await companySession();
  const result = await session.client.from("job_categories").select("id,name").eq("active", true).order("name");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  return result.data ?? [];
}

export async function saveCompanyOpening(input: unknown) {
  const parsed = openingDraftSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await companySession();
  const v = parsed.data;
  const result = await session.client.rpc("save_company_opening", {
    p_id: v.id ?? null, p_version: v.version ?? null, p_title: v.title, p_tasks: v.tasks,
    p_requirements: v.requirements, p_vacancies: v.vacancies === "" ? null : v.vacancies ?? null,
    p_location: v.location, p_modality: v.modality, p_schedule: v.schedule,
    p_contract_type: v.contractType, p_closing_date: v.closingDate || null,
    p_salary: v.salary, p_benefits: v.benefits, p_categories: v.categories,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return z.object({ id: z.string(), version: z.number() }).parse(result.data);
}

export async function submitCompanyOpening(input: unknown) {
  const parsed = openingSubmitSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await companySession();
  const result = await session.client.rpc("transition_opening", {
    p_opening: parsed.data.id, p_expected_version: parsed.data.version,
    p_command: "submit", p_reason: null, p_company_message: null,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
