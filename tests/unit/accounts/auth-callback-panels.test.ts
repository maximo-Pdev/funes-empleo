import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ exchange: vi.fn(), verify: vi.fn(), site: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchange, verifyOtp: mocks.verify } }) }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://portal.example.invalid" }) }));
vi.mock("@/features/accounts/navigation", () => ({ getSiteAccess: mocks.site }));
import { GET } from "@/app/auth/callback/route";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.verify.mockResolvedValue({ error: null });
});

it.each(["/dashboard", "/empresa", "/admin"])("opens the verified role panel %s after an ordinary auth callback", async href => {
  mocks.site.mockResolvedValue({ panel: { href } });
  const response = await GET(new NextRequest("https://portal.example.invalid/auth/callback?code=fictitious-code"));
  expect(response.headers.get("location")).toBe(`https://portal.example.invalid${href}#`);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it.each(["recovery", "invite"])("keeps %s tokens on individual password setup", async type => {
  mocks.site.mockResolvedValue({ panel: { href: "/admin" } });
  const response = await GET(new NextRequest(`https://portal.example.invalid/auth/callback?type=${type}&token_hash=fictitious-hash`));
  expect(response.headers.get("location")).toBe("https://portal.example.invalid/update-password#");
  expect(mocks.site).not.toHaveBeenCalled();
});

it("does not resolve private navigation for a failed token exchange", async () => {
  mocks.exchange.mockResolvedValue({ error: { message: "Fictitious private error" } });
  const response = await GET(new NextRequest("https://portal.example.invalid/auth/callback?code=invalid&next=https://other.example.invalid"));
  expect(response.headers.get("location")).toBe("https://portal.example.invalid/verification-expired#");
  expect(mocks.site).not.toHaveBeenCalled();
});
