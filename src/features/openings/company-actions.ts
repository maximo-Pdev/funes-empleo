"use server";
import { recordReference } from "@/lib/records/references";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { saveCompanyOpening, submitCompanyOpening, cancelCompanyOpening } from "./company-service";

export type CompanyOpeningState = { message: string; success: boolean; id?: string; reference?: string };
const failed = (error: unknown): CompanyOpeningState => ({ message: publicErrorFrom(error).message, success: false });

export async function saveCompanyOpeningAction(_previous: CompanyOpeningState, form: FormData): Promise<CompanyOpeningState> {
  try {
    const result = await saveCompanyOpening({ id: form.get("id") || undefined, version: form.get("version") || undefined,
      title: form.get("title"), tasks: form.get("tasks"), requirements: form.get("requirements"),
      vacancies: form.get("vacancies") || "", location: form.get("location"), modality: form.get("modality"),
      schedule: form.get("schedule"), contractType: form.get("contractType"), closingDate: form.get("closingDate"),
      salary: form.get("salary"), benefits: form.get("benefits"), categories: form.getAll("categories") });
    revalidatePath("/empresa"); revalidatePath("/empresa/ofertas"); revalidatePath("/empresa/ofertas/[openingId]", "page");
    if (result.status === "pending_review") {
      revalidatePath("/admin/openings"); revalidatePath("/admin/openings/[openingId]", "page");
      revalidatePath("/ofertas"); revalidatePath("/ofertas/[openingId]", "page");
    }
    return { message: result.status === "pending_review" ? "Cambios enviados a revisión. La oferta dejará de estar publicada hasta que la Oficina la apruebe." : "Borrador guardado. Enviá la oferta para revisión cuando esté completa.", success: true, id: result.id, reference: await recordReference("opening", result.id) };
  } catch (error) { return failed(error); }
}

export async function cancelCompanyOpeningAction(_previous: CompanyOpeningState, form: FormData): Promise<CompanyOpeningState> {
  try {
    const id = String(form.get("id"));
    await cancelCompanyOpening({ id, version: form.get("version"), reason: form.get("cancelReason"), confirmed: form.get("cancelConfirmed") === "on" });
    for (const path of ["/empresa", "/empresa/ofertas", "/empresa/ofertas/[openingId]", "/admin/openings", "/admin/openings/[openingId]", "/admin/participations", "/ofertas", "/ofertas/[openingId]", "/candidato/postulaciones"]) revalidatePath(path, "page");
    return { message: "Oferta cancelada. Se conservan los resultados finales y el historial.", success: true, id };
  } catch (error) { return failed(error); }
}

export async function submitCompanyOpeningAction(_previous: CompanyOpeningState, form: FormData): Promise<CompanyOpeningState> {
  try {
    await submitCompanyOpening({ id: form.get("id"), version: form.get("version") });
    const id = String(form.get("id"));
    revalidatePath("/empresa"); revalidatePath("/empresa/ofertas"); revalidatePath("/empresa/ofertas/[openingId]", "page");
    revalidatePath("/admin/openings");
    return { message: "Oferta enviada a revisión. La Oficina decidirá su publicación.", success: true, id, reference: await recordReference("opening", id) };
  } catch (error) { return failed(error); }
}
