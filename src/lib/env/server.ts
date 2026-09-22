import "server-only";
import { readEnvironment, serverEnvironmentSchema } from "./schema";

export function getServerEnvironment() {
  return readEnvironment(serverEnvironmentSchema, {
    APP_ENV: process.env.APP_ENV,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
    ACCEPTANCE_DEMO_PROJECT_REF: process.env.ACCEPTANCE_DEMO_PROJECT_REF || undefined,
    CONSENT_POLICY_VERSION: process.env.CONSENT_POLICY_VERSION,
  });
}
