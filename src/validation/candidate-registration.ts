import { z } from "zod";

export const candidateRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  dni: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().regex(/^\d{7,8}$/)),
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6).max(128),
});
