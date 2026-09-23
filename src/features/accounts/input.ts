import { z } from "zod";

// Account-specific input contracts; shared normalization/catalogs remain owned by T019.
export const credentialsInput = z.object({
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6).max(128),
});
export const registrationInput = credentialsInput.extend({ role: z.enum(["candidate", "company"]) });
export const emailInput = credentialsInput.pick({ email: true });
export const passwordInput = z.object({ password: z.string().min(6).max(128), confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, { path: ["confirmation"], message: "Las contraseñas deben coincidir." });
export const accountCommandInput = z.object({
  accountId: z.uuid(), version: z.coerce.number().int().positive(),
  command: z.enum(["suspend", "reactivate", "archive", "restore"]),
  reason: z.string().trim().max(500).optional(), confirmed: z.literal(true),
});
