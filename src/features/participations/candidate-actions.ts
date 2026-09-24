"use server";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { applyToOffer, withdrawParticipation } from "./candidate-service";

export type CandidateParticipationState = { message: string; success: boolean };
export async function applyToOfferAction(_previous: CandidateParticipationState, form: FormData): Promise<CandidateParticipationState> {
  try {
    await applyToOffer({ openingId: form.get("openingId"), candidateVersion: form.get("candidateVersion") });
    revalidatePath("/candidato/postulaciones");
    return { message: "Postulación recibida por la Oficina de Empleo.", success: true };
  } catch (error) { return { message: publicErrorFrom(error).message, success: false }; }
}
export async function withdrawParticipationAction(_previous: CandidateParticipationState, form: FormData): Promise<CandidateParticipationState> {
  try {
    await withdrawParticipation({ participationId: form.get("participationId"),
      version: form.get("version"), confirmed: form.get("confirmed") === "on" });
    revalidatePath("/candidato/postulaciones");
    return { message: "Participación retirada. La empresa ya no puede consultar esta derivación.", success: true };
  } catch (error) { return { message: publicErrorFrom(error).message, success: false }; }
}
