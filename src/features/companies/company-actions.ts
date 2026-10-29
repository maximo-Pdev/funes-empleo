"use server";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { registerCompany, saveCompanyProfile } from "./service";
import { registrationTermsSchema, registrationTermsMessage } from "@/features/accounts/legal-terms";
import { passwordConfirmationMessage, passwordConfirmationSchema } from "@/validation/password";

export type CompanyActionState = { message: string; success: boolean };
const failed = (error: unknown): CompanyActionState => ({ message: publicErrorFrom(error).message, success: false });

export async function registerCompanyAction(_previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  const passwords = passwordConfirmationSchema.safeParse({ password: form.get("password"), confirmation: form.get("confirmation") });
  if (!passwords.success) return { message: passwordConfirmationMessage, success: false };
  const terms = registrationTermsSchema.safeParse({ termsAccepted: form.get("termsAccepted") === "on", termsVersion: form.get("termsVersion") });
  if (!terms.success) return { message: registrationTermsMessage, success: false };
  try {
    await registerCompany({ legalName: form.get("legalName"), cuit: form.get("cuit"),
      responsibleName: form.get("responsibleName"), email: form.get("email"), phone: form.get("phone"),
      activity: form.get("activity"), locality: form.get("locality"), ...passwords.data, ...terms.data });
    return { message: "Si los datos son válidos, recibirás un enlace para verificar el correo. Revisá también spam.", success: true };
  } catch {
    return { message: "Revisá los datos de empresa, contacto y contraseña. Si el problema continúa, contactá a la Oficina.", success: false };
  }
}

export async function saveCompanyProfileAction(_previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  try {
    await saveCompanyProfile({ version: form.get("version"), legalName: form.get("legalName"), cuit: form.get("cuit"),
      responsibleName: form.get("responsibleName"), email: form.get("email"), phone: form.get("phone"),
      activity: form.get("activity"), locality: form.get("locality") });
    revalidatePath("/empresa"); revalidatePath("/empresa/perfil");
    return { message: "Perfil actualizado. Ya podés preparar ofertas para revisión municipal.", success: true };
  } catch (error) { return failed(error); }
}
