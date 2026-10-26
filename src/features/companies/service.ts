import "server-only";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClientEnvironment } from "@/lib/env/client";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { companyRegistrationSchema, companyProfileSchema } from "@/validation/company";

const profileShape = z.object({
  id: z.string(), legalName: z.string().nullable(), cuit: z.string().nullable(),
  responsibleName: z.string().nullable(), email: z.string().nullable(), phone: z.string().nullable(),
  activity: z.string().nullable(), locality: z.string().nullable(), status: z.string(), version: z.number(),
});
export type CompanyProfile = z.infer<typeof profileShape>;

export async function companySession() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "company" || session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  return session;
}

export async function registerCompany(input: unknown) {
  const parsed = companyRegistrationSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const client = await createServerSupabaseClient();
  const value = parsed.data;
  await client.auth.signUp({ email: value.email, password: value.password, options: {
    emailRedirectTo: getClientEnvironment().NEXT_PUBLIC_APP_URL + "/auth/callback",
    data: { role: "company", company_name: value.legalName, company_cuit: value.cuit,
      company_responsible: value.responsibleName, company_email: value.email, company_phone: value.phone,
      company_activity: value.activity, company_locality: value.locality },
  } });
  // The same outward response covers duplicate accounts and provider errors.
}

export async function getCompanyWorkspace() {
  const session = await companySession();
  let result = await session.client.rpc("my_company_profile");
  if (result.error) throw new AppError("INTERNAL_ERROR");
  if (!result.data) {
    const meta = session.user.user_metadata;
    const values = [meta?.company_name, meta?.company_cuit, meta?.company_responsible, meta?.company_email,
      meta?.company_phone, meta?.company_activity, meta?.company_locality];
    if (values.some((item) => typeof item !== "string")) return { profile: null, bootstrap: "registration_incomplete" as const, account: session.account };
    const bootstrap = await session.client.rpc("bootstrap_company", {
      p_name: values[0], p_cuit: values[1], p_responsible: values[2], p_email: values[3],
      p_phone: values[4], p_activity: values[5], p_locality: values[6],
    });
    if (bootstrap.error) return { profile: null, bootstrap: "duplicate_or_invalid" as const, account: session.account };
    result = await session.client.rpc("my_company_profile");
  }
  const profile = profileShape.safeParse(result.data);
  if (!profile.success) throw new AppError("INTERNAL_ERROR");
  return { profile: profile.data, bootstrap: "ready" as const, account: session.account };
}

export async function saveCompanyProfile(input: unknown) {
  const parsed = companyProfileSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await companySession();
  const value = parsed.data;
  const result = await session.client.rpc("save_company_profile", {
    p_version: value.version, p_name: value.legalName, p_cuit: value.cuit,
    p_responsible: value.responsibleName, p_email: value.email || "", p_phone: value.phone || "",
    p_activity: value.activity, p_locality: value.locality,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
