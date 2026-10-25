"use server";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { activateCandidate, saveCandidateProfile, setCandidatePhone } from "./profile-service";

export type CandidateActionState = { message: string; success: boolean };
function errorState(error: unknown): CandidateActionState {
  return { message: publicErrorFrom(error).message, success: false };
}
export async function saveProfileAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    await saveCandidateProfile({ version: form.get("version"), name: form.get("name"), dni: form.get("dni"),
      locality: form.get("locality"), summary: form.get("summary"), availability: form.get("availability"),
      detail: form.get("detail"), address: form.get("address"), categories: form.getAll("categories") });
    revalidatePath("/account");
    revalidatePath("/dashboard");
    return { message: "Perfil actualizado. Revisá los requisitos para activarlo.", success: true };
  } catch (error) { return errorState(error); }
}
export async function savePhoneAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    await setCandidatePhone({ version: form.get("version"), phone: form.get("phone") });
    revalidatePath("/account");
    revalidatePath("/dashboard");
    return { message: "Contacto actualizado.", success: true };
  } catch (error) { return errorState(error); }
}
export async function activateProfileAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    await activateCandidate({ version: form.get("version") });
    revalidatePath("/account");
    revalidatePath("/dashboard");
    return { message: "Perfil activo. Ya podés postularte a ofertas vigentes.", success: true };
  } catch (error) { return errorState(error); }
}
