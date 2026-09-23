import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getClientEnvironment } from "@/lib/env/client";
import { getServerEnvironment } from "@/lib/env/server";
import type { Database } from "./database.types";

// Deliberately do not export the privileged client itself.
export async function inviteIndividualAdministrator(email: string, actorAccountId: string) {
  const { SUPABASE_SECRET_KEY } = getServerEnvironment();
  if (!SUPABASE_SECRET_KEY) throw new Error("ADMIN_PROVISIONING_NOT_CONFIGURED");
  const env = getClientEnvironment();
  const client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const reservation = await client.rpc("reserve_administrator_invitation", { p_email: email, p_actor: actorAccountId });
  if (reservation.error || !reservation.data) throw new Error("ADMIN_PROVISIONING_FAILED");
  const result = await client.auth.admin.inviteUserByEmail(email, {
    // Invitations create an individual account, but do not assign a shared password.
    redirectTo: env.NEXT_PUBLIC_APP_URL + "/auth/callback?next=/update-password",
    data: { portal_invitation: reservation.data },
  });
  if (result.error) throw new Error("ADMIN_PROVISIONING_FAILED");
}
