import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import type { GetAllCookies, SetAllCookies } from "@supabase/ssr";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), signOut: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createClient }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://project.example.invalid", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fictitious",
}) }));
import { config, proxy } from "@/proxy";

let adapter: { getAll: GetAllCookies; setAll: SetAllCookies };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mocks.createClient.mockImplementation((_url: string, _key: string, options: { cookies: typeof adapter }) => {
    adapter = options.cookies;
    return { auth: { getUser: mocks.getUser, signOut: mocks.signOut } };
  });
});

it.each(["/", "/ofertas", "/ofertas/ficticia", "/dashboard?section=perfil", "/empresa/perfil", "/admin/openings", "/company/openings/ficticia/referrals", "/account", "/update-password", "/api/cv/ficticio", "/auth/callback"])("renueva sesión en %s", url => {
  expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
});

it.each(["/_next/static/chunk.js", "/_next/image?url=ficticia", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/brand/logo.svg", "/imagen.png", "/imagen.webp"])("excluye assets %s", url => {
  expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
});

it("propaga cookies renovadas al request y al navegador con sus opciones sin cerrar sesión", async () => {
  const request = new NextRequest("https://portal.example.invalid/ofertas", { headers: { cookie: "auth=synthetic-old" } });
  mocks.getUser.mockImplementation(async () => {
    expect(await adapter.getAll()).toEqual([{ name: "auth", value: "synthetic-old" }]);
    await adapter.setAll([{ name: "auth", value: "synthetic-renewed", options: { path: "/", maxAge: 3600, sameSite: "lax", httpOnly: true } }], {});
    return { data: { user: { id: "ficticio" } }, error: null };
  });
  const response = await proxy(request);
  expect(request.cookies.get("auth")?.value).toBe("synthetic-renewed");
  expect(response.headers.get("x-middleware-request-cookie")).toContain("auth=synthetic-renewed");
  expect(response.cookies.get("auth")).toMatchObject({ value: "synthetic-renewed", path: "/", maxAge: 3600, sameSite: "lax", httpOnly: true });
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("location")).toBeNull();
  expect(mocks.signOut).not.toHaveBeenCalled();
});

it("conserva cookies y cache headers de escrituras previas y chunks eliminados", async () => {
  mocks.getUser.mockImplementation(async () => {
    await adapter.setAll([
      { name: "auth.0", value: "synthetic-first", options: { path: "/", maxAge: 3600 } },
      { name: "auth.2", value: "", options: { path: "/", maxAge: 0 } },
    ], { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" });
    await adapter.setAll([{ name: "auth.1", value: "synthetic-second", options: { path: "/", maxAge: 3600 } }], {});
    return { data: { user: null }, error: null };
  });
  const response = await proxy(new NextRequest("https://portal.example.invalid/dashboard?section=perfil"));
  expect(response.cookies.get("auth.0")?.value).toBe("synthetic-first");
  expect(response.cookies.get("auth.1")?.value).toBe("synthetic-second");
  expect(response.cookies.get("auth.2")).toMatchObject({ value: "", maxAge: 0 });
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("expires")).toBe("0");
  expect(response.headers.get("pragma")).toBe("no-cache");
});

it("crea un cliente por request y no reutiliza cookies entre personas", async () => {
  const first = new NextRequest("https://portal.example.invalid/", { headers: { cookie: "auth=synthetic-first" } });
  const second = new NextRequest("https://portal.example.invalid/", { headers: { cookie: "auth=synthetic-second" } });
  await proxy(first);
  const firstAdapter = adapter;
  await proxy(second);
  expect(mocks.createClient).toHaveBeenCalledTimes(2);
  expect(adapter).not.toBe(firstAdapter);
  expect(await firstAdapter.getAll()).toEqual([{ name: "auth", value: "synthetic-first" }]);
  expect(await adapter.getAll()).toEqual([{ name: "auth", value: "synthetic-second" }]);
});
