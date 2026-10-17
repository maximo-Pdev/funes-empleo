import { z } from "zod";

export const passwordConfirmationMessage = "Las contraseñas deben coincidir y tener entre 6 y 128 caracteres.";
export const passwordSchema = z.string().min(6).max(128);
export const passwordConfirmationSchema = z.object({
  password: passwordSchema,
  confirmation: passwordSchema,
}).refine(value => value.password === value.confirmation, {
  path: ["confirmation"], message: passwordConfirmationMessage,
});
