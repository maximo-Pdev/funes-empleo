import { z } from "zod";

// Registration terms never grant operational referral permissions.
export const REGISTRATION_TERMS_VERSION = "demo-terms-draft-1";
export const registrationTermsLabel = "He leído y acepto los términos de uso de la demostración y he leído el aviso de privacidad. Entiendo que solo debo utilizar datos ficticios.";
export const registrationTermsMessage = "Leé y aceptá los términos de la demostración y el aviso de privacidad para registrarte.";
export const registrationTermsSchema = z.object({
  termsAccepted: z.literal(true),
  termsVersion: z.literal(REGISTRATION_TERMS_VERSION),
});
