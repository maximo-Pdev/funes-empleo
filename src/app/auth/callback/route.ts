import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClientEnvironment } from "@/lib/env/client";
import { getAccessHref } from "@/features/accounts/access-notices";
import { getSiteAccess } from "@/features/accounts/navigation";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const recovery = ["recovery", "invite"].includes(url.searchParams.get("type") ?? "") || url.searchParams.get("next") === "/update-password";
  let destination = recovery ? "/update-password" : "/account";
  let valid = false;
  try {
    const client = await createServerSupabaseClient();
    const code = url.searchParams.get("code");
    const hash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    if (code) valid = !(await client.auth.exchangeCodeForSession(code)).error;
    else if (hash && (type === "signup" || type === "recovery" || type === "invite")) valid = !(await client.auth.verifyOtp({ token_hash: hash, type })).error;
    if (valid && !recovery) destination = (await getSiteAccess()).panel?.href ?? "/account";
  } catch { /* Never log URL, token, Auth response or secret. */ }
  const redirectUrl = new URL(valid ? destination : recovery ? getAccessHref("recovery-invalid") : "/verification-expired", getClientEnvironment().NEXT_PUBLIC_APP_URL);
  // Explicit empty fragment stops browsers inheriting Auth's fragment during an HTTP redirect.
  // Never carry access tokens or Auth error details onto a user-facing page URL.
  redirectUrl.hash = "#";
  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
