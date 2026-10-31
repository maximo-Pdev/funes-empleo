import { z } from "zod";
import { passwordConfirmationSchema, passwordSchema } from "@/validation/password";
import { registrationTermsSchema } from "./legal-terms";

// Account-specific input contracts; shared normalization/catalogs remain owned by T019.
export const credentialsInput = z.object({
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
  password: passwordSchema,
});
export const registrationInput = credentialsInput.extend({ role: z.enum(["candidate", "company"]), ...registrationTermsSchema.shape }).and(passwordConfirmationSchema);
export const emailInput = credentialsInput.pick({ email: true });
export const passwordInput = passwordConfirmationSchema;
export const accountCommandInput = z.object({
  accountId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  version: z.coerce.number().int().positive(),
  command: z.enum(["suspend", "reactivate", "archive", "restore"]),
  reason: z.string().trim().max(500).optional(), confirmed: z.literal(true),
});
