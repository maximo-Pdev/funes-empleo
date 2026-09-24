import { z } from "zod";

// PostgreSQL UUIDs from the reproducible fixture are MD5-derived and need not
// carry RFC version/variant bits. Validate their database syntax, not z.guid().
export const databaseUuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const digitsAndSeparators = z.string().trim().min(1, "Ingresá un identificador.")
  .regex(/^[0-9.\s-]+$/, "Usá solo números y separadores habituales.");

export const dniSchema = digitsAndSeparators
  .transform((value) => value.replace(/[.\s-]/g, ""))
  .pipe(z.string().regex(/^\d+$/, "Ingresá un DNI válido.").max(20));

export const cuitSchema = digitsAndSeparators
  .transform((value) => value.replace(/[.\s-]/g, ""))
  .pipe(z.string().regex(/^\d{11}$/, "Ingresá un CUIT de 11 dígitos."));

export const emailContactSchema = z.preprocess(
  (value) => typeof value === "string" ? value.trim().toLowerCase() : value,
  z.email("Ingresá un correo electrónico válido."),
);

export const phoneContactSchema = z.string().trim().min(1, "Ingresá un teléfono.")
  .regex(/^\+?[0-9().\s-]+$/, "Ingresá un teléfono válido.")
  .transform((value) => value.replace(/[().\s-]/g, ""))
  .pipe(z.string().regex(/^\+?\d+$/, "Ingresá un teléfono válido.").max(21));

export function normalizeDni(value: string): string | null {
  const result = dniSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function normalizeCuit(value: string): string | null {
  const result = cuitSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function normalizeEmail(value: string): string | null {
  const result = emailContactSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function normalizePhone(value: string): string | null {
  const result = phoneContactSchema.safeParse(value);
  return result.success ? result.data : null;
}
