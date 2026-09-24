import { z } from "zod";
import { cuitSchema, emailContactSchema, phoneContactSchema } from "./common";

const companyFields = z.object({
  legalName: z.string().trim().min(2).max(200),
  cuit: cuitSchema,
  responsibleName: z.string().trim().min(2).max(200),
  email: z.string().trim().max(320),
  phone: z.string().trim().max(50),
  activity: z.string().trim().min(2).max(500),
  locality: z.string().trim().min(2).max(150),
}).superRefine((value, context) => {
  if (!value.email && !value.phone) context.addIssue({ code: "custom", path: ["email"], message: "Ingresá un contacto." });
  if (value.email && !emailContactSchema.safeParse(value.email).success) context.addIssue({ code: "custom", path: ["email"], message: "Ingresá un correo válido." });
  if (value.phone && !phoneContactSchema.safeParse(value.phone).success) context.addIssue({ code: "custom", path: ["phone"], message: "Ingresá un teléfono válido." });
});

export const companyRegistrationSchema = companyFields.safeExtend({
  password: z.string().min(6).max(128),
});
export const companyProfileSchema = companyFields.safeExtend({
  version: z.coerce.number().int().positive(),
});
