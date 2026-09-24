"use server";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { changeCandidateConsent } from "./consent-service";
import type { CandidateActionState } from "./profile-actions";

export async function changeConsentAction(_previous: CandidateActionState, form: FormData): Promise<CandidateActionState> {
  try {
    const status = form.get("status");
    await changeCandidateConsent({ version: form.get("version"), status,
      confirmed: form.get("confirmed") === "on" });
    revalidatePath("/candidato/perfil");
    revalidatePath("/candidato/postulaciones");
    return { message: status === "withdrawn" ?
      "Consentimiento retirado. Las participaciones abiertas se cerraron y los accesos empresariales quedaron revocados." :
      "Consentimiento registrado. Las participaciones cerradas no se reabren.", success: true };
  } catch (error) { return { message: publicErrorFrom(error).message, success: false }; }
}
