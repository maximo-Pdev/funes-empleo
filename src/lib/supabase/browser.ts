"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getClientEnvironment } from "@/lib/env/client";
import type { Database } from "./database.types";
export function createBrowserSupabaseClient() {
  const env = getClientEnvironment();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
