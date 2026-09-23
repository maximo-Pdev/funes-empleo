import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientEnvironment } from "@/lib/env/client";
import type { Database } from "@/lib/supabase/database.types";

// Session refresh only: never a substitute for action guards and transactional RLS.
export async function proxy(request: NextRequest) {
  const env = getClientEnvironment();
  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/account/:path*", "/update-password"] };
