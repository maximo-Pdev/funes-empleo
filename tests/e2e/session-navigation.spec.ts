import { expect, test, type BrowserContext } from "@playwright/test";
import { createChunks, stringFromBase64URL, stringToBase64URL } from "@supabase/ssr";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { loginFixture } from "./fixtures/quality";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

async function sessionCookie(context: BrowserContext) {
  const cookies = await context.cookies("http://127.0.0.1:3000");
  const chunks = cookies.filter(cookie => /^sb-127-auth-token(?:\.\d+)?$/.test(cookie.name))
    .sort((first, second) => Number(first.name.split(".").pop() ?? 0) - Number(second.name.split(".").pop() ?? 0));
  if (!chunks.length) throw new Error("Falta sesión local de prueba.");
  const encoded = chunks.map(cookie => cookie.value).join("");
  if (!encoded.startsWith("base64-")) throw new Error("Formato local de sesión inesperado.");
  const value: unknown = JSON.parse(stringFromBase64URL(encoded.slice(7)));
  if (!value || typeof value !== "object" || !("expires_at" in value) || typeof value.expires_at !== "number") {
    throw new Error("La sesión local no contiene vencimiento.");
  }
  return { chunks, value, expiresAt: value.expires_at };
}

async function expireStoredSession(context: BrowserContext) {
  const { chunks, value } = await sessionCookie(context);
  const template = chunks[0]!;
  await context.addCookies(chunks.map(cookie => ({ ...cookie, expires: 1 })));
  const encoded = "base64-" + stringToBase64URL(JSON.stringify({ ...value, expires_at: 1 }));
  await context.addCookies(createChunks("sb-127-auth-token", encoded).map(cookie => ({ ...template, ...cookie })));
}

for (const account of [
  { role: "candidate", href: "/dashboard?section=perfil", label: "Mi perfil", panelHref: "/dashboard", panelLabel: "Ir al panel de usuario" },
  { role: "company", href: "/empresa/perfil", label: "Mi perfil", panelHref: "/empresa", panelLabel: "Ir al panel de empresa" },
  { role: "admin", href: "/account", label: "Cuenta", panelHref: "/admin", panelLabel: "Ir al panel de administración" },
] as const) {
  for (const entry of ["public", "private"] as const) {
    test(`${account.role}: renueva en página ${entry}, conserva sesión al navegar y cierra explícitamente`, async ({ page: loginPage, browser }) => {
      await loginFixture(loginPage, account.role);
      const storageState = await loginPage.context().storageState();
      // Dispose the login document and its background requests before injecting
      // expiry. The new context has no pending admin prefetch/notification work.
      await loginPage.context().close();
      const isolatedContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000", storageState });
      try {
      const page = await isolatedContext.newPage();
      await expireStoredSession(page.context());
      expect((await sessionCookie(page.context())).expiresAt).toBe(1);
      const response = await page.goto(entry === "public" ? "/ofertas" : account.href);
      expect(response?.headers()["cache-control"]).toContain("no-store");
      const refreshed = await sessionCookie(page.context());
      expect(refreshed.expiresAt > Math.floor(Date.now() / 1000)).toBe(true);

      await page.goto("/ofertas");
      const detail = await page.locator('a[href^="/ofertas/"]').first().getAttribute("href");
      if (!detail) throw new Error("Falta una oferta pública de prueba.");

      for (const path of ["/", "/ofertas", detail]) {
        await page.goto(path);
        const navigation = page.getByRole("navigation", { name: path === "/" ? "Accesos principales" : "Navegación principal", exact: true });
        const destination = path === "/" ? { label: account.panelLabel, href: account.panelHref }
          : { label: "Mi cuenta", href: account.panelHref };
        if (path === "/") {
          await expect(page.getByRole("heading", { level: 1, name: "El empleo en Funes, con acompañamiento municipal." })).toBeVisible();
          await expect(page.getByRole("region", { name: "Acceso al portal" })).toContainText("Tu sesión está activa. Continuá desde tu panel.");
          await expect(page.getByRole("region", { name: "Acceso al portal" }).getByRole("button", { name: "Cerrar sesión", exact: true })).toHaveCount(1);
        }
        if (path !== "/") {
          await page.setViewportSize({ width: 320, height: 800 });
          await expect(navigation).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
          const brand = await navigation.getByRole("link", { name: "Ir al sitio de la Municipalidad de Funes" }).boundingBox();
          const first = await navigation.getByRole("link", { name: "Inicio", exact: true }).boundingBox();
          if (!brand || !first) throw new Error("Falta navegación pública visible.");
          expect(first.x).toBeGreaterThanOrEqual(brand.x + brand.width + 8);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.setViewportSize({ width: 1280, height: 720 });
        }

        if (path === "/ofertas") {
          await expect(page.getByRole("link", { name: "Crear cuenta", exact: true })).toHaveCount(0);
          await expect(page.getByRole("link", { name: "Iniciá sesión", exact: true })).toHaveCount(0);
          await expect(page.getByRole("complementary")).toHaveCount(0);
          await expect(page.getByRole("navigation", { name: "Accesos principales", exact: true })).toHaveCount(0);
        }
        await expect(navigation.getByRole("link", { name: destination.label, exact: true })).toHaveAttribute("href", destination.href);
        await expect(navigation.getByRole("link", { name: "Iniciar sesión", exact: true })).toHaveCount(0);
        await navigation.getByRole("link", { name: destination.label, exact: true }).click();
        await expect(page).toHaveURL(destination.href);
        await page.reload();
        await expect(page).toHaveURL(destination.href);
      }

      const resumed = await browser.newContext({ baseURL: "http://127.0.0.1:3000", storageState: await page.context().storageState() });
      try {
        const tab = await resumed.newPage();
        await tab.goto(account.href);
        await expect(tab).toHaveURL(account.href);

        await page.goto("/account");
        await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
        await page.goto("/");
        await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
        await page.goto("/ofertas");
        await expect(page.getByRole("navigation", { name: "Navegación principal", exact: true }).getByRole("link", { name: "Inicio", exact: true })).toHaveAttribute("href", "/");
        await expect(page.getByRole("link", { name: "Mi cuenta", exact: true })).toHaveCount(0);
        await page.goto(account.href);
        await expect(page).toHaveURL(/\?acceso=sesion-vencida$/);
        await tab.goto(account.href);
        await expect(tab).toHaveURL(/\?acceso=sesion-vencida$/);
        await tab.goto("/");
        await expect(tab.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
      } finally { await resumed.close(); }
      } finally { await isolatedContext.close(); }
    });
  }
}
