import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { inviteIndividualAdministrator } from "@/lib/supabase/admin";
import { getClientEnvironment } from "@/lib/env/client";
import { readAccountSession } from "@/lib/auth/session";
import { registrationInput, credentialsInput, emailInput, passwordInput, accountCommandInput } from "./input";

export async function registerAccount(input: unknown) {
  const parsed = registrationInput.safeParse(input);
  if (!parsed.success) return false;
  const client = await createServerSupabaseClient();
  const { email, password, role } = parsed.data;
  const result = await client.auth.signUp({ email, password, options: {
    emailRedirectTo: getClientEnvironment().NEXT_PUBLIC_APP_URL + "/auth/callback", data: { role },
  } });
  // Never return user, identities, tokens, duplicate-account errors or existence.
  return !result.error;
}
export async function signIn(input: unknown) {
  const parsed = credentialsInput.safeParse(input);
  if (!parsed.success) return { status: "invalid" as const };
  const client = await createServerSupabaseClient();
  const result = await client.auth.signInWithPassword(parsed.data);
  if (result.error) return { status: "invalid" as const };
  const session = await readAccountSession();
  if (!session) { await client.auth.signOut({ scope: "local" }); return { status: "invalid" as const }; }
  if (session.account.status !== "active") {
    await client.auth.signOut({ scope: "local" });
    return { status: session.account.status === "suspended" ? "suspended" as const : "invalid" as const };
  }
  return { status: "active" as const };
}
export async function requestRecovery(input: unknown) {
  const parsed = emailInput.safeParse(input);
  if (!parsed.success) return;
  const client = await createServerSupabaseClient();
  await client.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getClientEnvironment().NEXT_PUBLIC_APP_URL + "/auth/callback?next=/update-password",
  });
}
export async function resendVerification(input: unknown) {
  const parsed = emailInput.safeParse(input);
  if (!parsed.success) return;
  const client = await createServerSupabaseClient();
  await client.auth.resend({ type: "signup", email: parsed.data.email, options: {
    emailRedirectTo: getClientEnvironment().NEXT_PUBLIC_APP_URL + "/auth/callback",
  } });
}
export async function updatePassword(input: unknown) {
  const parsed = passwordInput.safeParse(input);
  if (!parsed.success) return false;
  const session = await readAccountSession();
  if (!session || session.account.status !== "active") return false;
  const result = await session.client.auth.updateUser({ password: parsed.data.password });
  if (result.error) return false;
  await session.client.auth.signOut({ scope: "global" });
  return true;
}
export async function changeAccountStatus(input: unknown) {
  const parsed = accountCommandInput.safeParse(input);
  if (!parsed.success) return { code: "INVALID_INPUT" as const };
  const session = await readAccountSession();
  if (!session || session.account.status !== "active") return { code: "AUTH_REQUIRED" as const };
  const { accountId, version, command, reason, confirmed } = parsed.data;
  const result = await session.client.rpc("change_account_status", {
    p_account: accountId, p_version: version, p_command: command, p_reason: reason ?? "", p_confirmed: confirmed,
  });
  if (result.error) return { code: result.error.message === "CONFLICT_STALE_DATA" ? "CONFLICT_STALE_DATA" as const : "DENIED" as const };
  return { code: "OK" as const, version: result.data };
}
// Operator service, intentionally not exported as a public Server Action or ordinary panel operation.
export async function provisionAdministrator(input: unknown) {
  const parsed = emailInput.safeParse(input);
  const session = await readAccountSession();
  if (!parsed.success || !session || session.account.status !== "active" || session.account.role !== "admin") throw new Error("FORBIDDEN");
  await inviteIndividualAdministrator(parsed.data.email, session.account.id);
}
