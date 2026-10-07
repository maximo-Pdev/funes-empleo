import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginFixture } from "./fixtures/quality";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local ficticio"));
const journeys = {
  candidate: ["/candidato/perfil", "/candidato/ofertas", "/candidato/postulaciones"],
  company: ["/empresa/perfil", "/empresa/ofertas", "/empresa/ofertas/nueva"],
  admin: ["/admin/candidates", "/admin/candidates/assisted", "/admin/openings", "/admin/empresas", "/admin/participations", "/admin/imports/new", "/admin/metrics?from=2026-09-01&to=2026-09-20"],
} as const;
for (const role of ["candidate", "company", "admin"] as const) {
  for (const viewport of [{ width: 360, height: 800 }, { width: 1366, height: 768 }]) {
    test(`${role}: axe, controles y foco ${viewport.width}x${viewport.height}`, async ({ page }) => {
      test.setTimeout(180000);
      await page.setViewportSize(viewport);
      await loginFixture(page, role);
      for (const path of journeys[role]) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(path.split("?")[0] + "(?:\\?|$)"));
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.getByRole("heading", { name: "Ocurrió un problema", exact: true })).toHaveCount(0);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
      }
    });
  }
}
