import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

for (const [role, destination] of [["admin", "/admin"], ["candidate", "/dashboard"], ["company", "/empresa"]] as const) {
  test(`${role}: Cuenta, último enlace y cierre de sesión no se superponen`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill(`${role}1@example.invalid`);
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar.getByTitle(`${role}1@example.invalid`)).toBeVisible();
    const content = sidebar.locator('[data-slot="sidebar-content"]');
    const footer = sidebar.locator('[data-slot="sidebar-footer"]');
    const logout = sidebar.getByRole("button", { name: "Cerrar sesión", exact: true });
    for (const [width, height] of [[1920, 1080], [1366, 900], [1366, 768], [1024, 600], [960, 540], [768, 500]]) {
      await page.setViewportSize({ width: width!, height: height! });
      for (const link of [sidebar.getByRole("link", { name: "Cuenta", exact: true }), content.getByRole("link").last()]) {
        await link.focus(); await expect(link).toBeFocused();
        const boxes = await sidebar.evaluate(element => {
          const rect = (selector: string) => {
            const box = element.querySelector(selector)!.getBoundingClientRect();
            return { top: box.top, bottom: box.bottom };
          };
          const focused = document.activeElement!.getBoundingClientRect();
          return { content: rect('[data-slot="sidebar-content"]'), footer: rect('[data-slot="sidebar-footer"]'),
            focused: { top: focused.top, bottom: focused.bottom } };
        });
        expect(boxes.content.bottom).toBeLessThanOrEqual(boxes.footer.top);
        expect(boxes.focused.bottom).toBeLessThanOrEqual(boxes.content.bottom + 1);
        expect(boxes.focused.top).toBeGreaterThanOrEqual(boxes.content.top - 1);
        expect(boxes.footer.bottom).toBeLessThanOrEqual(height! + 1);
      }
      await logout.focus(); await expect(logout).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await sidebar.getByRole("button", { name: "Contraer menú", exact: true }).click();
    await expect(content).toBeHidden(); await expect(logout).toBeHidden();
    await sidebar.getByRole("button", { name: "Expandir menú", exact: true }).click();
    await expect(content).toBeVisible(); await expect(logout).toBeVisible();
    const footerHandle = await footer.elementHandle();
    expect(await content.evaluate((element, peer) => element.getBoundingClientRect().bottom <= peer!.getBoundingClientRect().top, footerHandle)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id)).toEqual([]);
  });
}
