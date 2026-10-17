import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientEnvironment } from "@/lib/env/client";
import type { Database } from "@/lib/supabase/database.types";

// Session refresh only: never a substitute for action guards and transactional RLS.
export async function proxy(request: NextRequest) {
  const env = getClientEnvironment();
  let response = NextResponse.next({ request });
  const refreshedCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const refreshHeaders = new Headers();
  const client = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        for (const cookie of values) {
          request.cookies.set(cookie.name, cookie.value);
          refreshedCookies.set(cookie.name, cookie);
        }
        for (const [name, value] of Object.entries(headers)) refreshHeaders.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of refreshedCookies.values()) response.cookies.set(name, value, options);
        for (const [name, value] of refreshHeaders) response.headers.set(name, value);
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  return response;
}
export const config = {
  matcher: ["/((?!_next/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
