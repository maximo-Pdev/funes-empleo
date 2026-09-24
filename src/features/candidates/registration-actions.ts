"use server";
import { registerCandidate } from "./registration-service";

export type CandidateFormState = { message: string; success: boolean };
export async function registerCandidateAction(_previous: CandidateFormState, form: FormData): Promise<CandidateFormState> {
  try {
    await registerCandidate({ name: form.get("name"), dni: form.get("dni"),
      email: form.get("email"), password: form.get("password") });
    return { message: "Si los datos son válidos, recibirás un enlace para verificar tu correo. Revisá también spam.", success: true };
  } catch {
    return { message: "Revisá nombre, DNI, correo y contraseña. Si el problema sigue, contactá a la Oficina.", success: false };
  }
}
