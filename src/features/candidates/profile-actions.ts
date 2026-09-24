"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { archiveCandidate, activateCandidate, saveCandidateProfile, setCandidatePhone } from "./profile-service";

export type CandidateActionState = { message: string; success: boolean };
function errorState(error: unknown): CandidateActionState {
  return { message: publicErrorFrom(error).message, success: false };
}
export async function saveProfileAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    await saveCandidateProfile({ version: form.get("version"), name: form.get("name"), dni: form.get("dni"),
      locality: form.get("locality"), summary: form.get("summary"), availability: form.get("availability"),
      detail: form.get("detail"), address: form.get("address"), categories: form.getAll("categories") });
    revalidatePath("/candidato/perfil");
    return { message: "Perfil actualizado. Revisá los requisitos para activarlo.", success: true };
  } catch (error) { return errorState(error); }
}
export async function savePhoneAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    await setCandidatePhone({ version: form.get("version"), phone: form.get("phone") });
    revalidatePath("/candidato/perfil");
    return { message: "Contacto actualizado.", success: true };
  } catch (error) { return errorState(error); }
}
export async function activateProfileAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    await activateCandidate({ version: form.get("version") });
    revalidatePath("/candidato/perfil");
    return { message: "Perfil activo. Ya podés postularte a ofertas vigentes.", success: true };
  } catch (error) { return errorState(error); }
}
export async function archiveProfileAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try { await archiveCandidate({ version: form.get("version"), confirmed: form.get("confirmed") === "on" }); }
  catch (error) { return errorState(error); }
  redirect("/session-expired");
}
