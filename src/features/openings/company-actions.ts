"use server";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { saveCompanyOpening, submitCompanyOpening } from "./company-service";

export type CompanyOpeningState = { message: string; success: boolean; id?: string };
const failed = (error: unknown): CompanyOpeningState => ({ message: publicErrorFrom(error).message, success: false });

export async function saveCompanyOpeningAction(_previous: CompanyOpeningState, form: FormData): Promise<CompanyOpeningState> {
  try {
    const result = await saveCompanyOpening({ id: form.get("id") || undefined, version: form.get("version") || undefined,
      title: form.get("title"), tasks: form.get("tasks"), requirements: form.get("requirements"),
      vacancies: form.get("vacancies") || "", location: form.get("location"), modality: form.get("modality"),
      schedule: form.get("schedule"), contractType: form.get("contractType"), closingDate: form.get("closingDate"),
      salary: form.get("salary"), benefits: form.get("benefits"), categories: form.getAll("categories") });
    revalidatePath("/empresa"); revalidatePath("/empresa/ofertas"); revalidatePath(`/empresa/ofertas/${result.id}`);
    return { message: "Borrador guardado. Enviá la oferta para revisión cuando esté completa.", success: true, id: result.id };
  } catch (error) { return failed(error); }
}

export async function submitCompanyOpeningAction(_previous: CompanyOpeningState, form: FormData): Promise<CompanyOpeningState> {
  try {
    await submitCompanyOpening({ id: form.get("id"), version: form.get("version") });
    const id = String(form.get("id"));
    revalidatePath("/empresa"); revalidatePath("/empresa/ofertas"); revalidatePath(`/empresa/ofertas/${id}`);
    revalidatePath("/admin/openings");
    return { message: "Oferta enviada a revisión. La Oficina decidirá su publicación.", success: true, id };
  } catch (error) { return failed(error); }
}
