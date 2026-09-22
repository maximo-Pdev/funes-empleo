import { z } from "zod";

const httpUrl = z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol));
const publishableKey = z.string().min(1).refine((value) => {
  if (value.startsWith("sb_publishable_")) return true;
  // Local/legacy anon JWTs are public configuration, never service_role JWTs.
  // This is a configuration guard, not token authentication or signature validation.
  try {
    const parts = value.split(".");
    if (parts.length !== 3 || !parts[1]) return false;
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload === "object" && payload !== null && "role" in payload && payload.role === "anon";
  } catch {
    return false;
  }
});
export const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
});
export const serverEnvironmentSchema = z.object({
  APP_ENV: z.enum(["local", "preview", "demo"]),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  ACCEPTANCE_DEMO_PROJECT_REF: z.string().min(1).optional(),
  CONSENT_POLICY_VERSION: z.string().min(1),
});

export function readEnvironment<T>(schema: z.ZodType<T>, values: unknown): T {
  const result = schema.safeParse(values);
  if (!result.success) {
    // Never include values, Zod issues or secrets in the thrown error.
    throw new Error("La configuración del entorno es inválida. Revisá los nombres y valores requeridos.");
  }
  return result.data;
}
