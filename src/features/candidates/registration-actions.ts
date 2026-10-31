"use server";
import { registerCandidate } from "./registration-service";
import { registrationTermsSchema, registrationTermsMessage } from "@/features/accounts/legal-terms";
import { passwordConfirmationMessage, passwordConfirmationSchema } from "@/validation/password";

export type CandidateFormState = { message: string; success: boolean };
export async function registerCandidateAction(_previous: CandidateFormState, form: FormData): Promise<CandidateFormState> {
  const passwords = passwordConfirmationSchema.safeParse({ password: form.get("password"), confirmation: form.get("confirmation") });
  if (!passwords.success) return { message: passwordConfirmationMessage, success: false };
  const terms = registrationTermsSchema.safeParse({ termsAccepted: form.get("termsAccepted") === "on", termsVersion: form.get("termsVersion") });
  if (!terms.success) return { message: registrationTermsMessage, success: false };
  try {
    await registerCandidate({ name: form.get("name"), dni: form.get("dni"),
      email: form.get("email"), ...passwords.data, ...terms.data });
    return { message: "Si los datos son válidos, recibirás un enlace para verificar tu correo. Revisá también spam.", success: true };
  } catch {
    return { message: "Revisá nombre, DNI, correo y contraseña. Si el problema sigue, contactá a la Oficina.", success: false };
  }
}
