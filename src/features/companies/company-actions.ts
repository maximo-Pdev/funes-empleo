"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { changeAccountStatus } from "@/features/accounts/service";
import { companySession, registerCompany, saveCompanyProfile } from "./service";

export type CompanyActionState = { message: string; success: boolean };
const failed = (error: unknown): CompanyActionState => ({ message: publicErrorFrom(error).message, success: false });

export async function registerCompanyAction(_previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  try {
    await registerCompany({ legalName: form.get("legalName"), cuit: form.get("cuit"),
      responsibleName: form.get("responsibleName"), email: form.get("email"), phone: form.get("phone"),
      activity: form.get("activity"), locality: form.get("locality"), password: form.get("password") });
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

export async function archiveCompanyAction(_previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  const session = await companySession();
  const result = await changeAccountStatus({ accountId: session.account.id, version: form.get("accountVersion"),
    command: "archive", reason: "", confirmed: form.get("confirmed") === "on" });
  if (result.code !== "OK") return { message: result.code === "CONFLICT_STALE_DATA" ?
    "Los datos cambiaron. Recargá antes de intentar de nuevo." : "No se pudo archivar. Revisá la confirmación.", success: false };
  redirect("/session-expired");
}
