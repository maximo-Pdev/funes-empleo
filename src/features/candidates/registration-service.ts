import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClientEnvironment } from "@/lib/env/client";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { candidateRegistrationSchema } from "@/validation/candidate-registration";

export async function registerCandidate(input: unknown) {
  const parsed = candidateRegistrationSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const client = await createServerSupabaseClient();
  const { name, dni, email, password } = parsed.data;
  await client.auth.signUp({ email, password, options: {
    emailRedirectTo: getClientEnvironment().NEXT_PUBLIC_APP_URL + "/auth/callback",
    data: { role: "candidate", candidate_name: name, candidate_dni: dni },
  } });
  // Same response for existing email, duplicate DNI and provider failures.
}

export async function bootstrapCandidate() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "candidate" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  const profile = await session.client.from("candidate_profiles").select("id").eq("account_id", session.account.id).maybeSingle();
  if (profile.error) throw new AppError("INTERNAL_ERROR");
  if (profile.data) return "ready" as const;
  // Metadata supplies registration input only. SQL derives the actor from the
  // live session, validates it again, and never uses metadata for permission.
  const name = session.user.user_metadata?.candidate_name;
  const dni = session.user.user_metadata?.candidate_dni;
  if (typeof name !== "string" || typeof dni !== "string") return "registration_incomplete" as const;
  const result = await session.client.rpc("bootstrap_candidate", { p_name: name, p_dni: dni });
  if (result.error) return "duplicate_review_required" as const;
  return result.data === "pending_in_person_claim" ? "pending_in_person_claim" as const : "ready" as const;
}
