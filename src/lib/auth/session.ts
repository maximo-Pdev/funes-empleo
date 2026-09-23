import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function readAccountSession() {
  // No request-spanning cache, getSession or user_metadata-based authorization.
  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at) return null;
  const account = await client.rpc("my_account_status");
  if (account.error || !account.data?.[0]) return null;
  return { client, user: data.user, account: account.data[0] };
}
