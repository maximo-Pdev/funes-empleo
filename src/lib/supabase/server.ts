import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientEnvironment } from "@/lib/env/client";
import type { Database } from "./database.types";
export async function createServerSupabaseClient() {
  const env = getClientEnvironment();
  const jar = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try { for (const { name, value, options } of values) jar.set(name, value, options); }
        catch { /* Read-only Server Component: the proxy persists refreshed cookies. */ }
      },
    },
  });
}
