import { canonicalFixturePath } from "./fixtures/record-reference";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off", locale: "en-US" });
test.beforeEach(() => assertLocalTargets());

function fixtureId(kind: string, number: number) {
  const hash = createHash("md5").update(`funes-demo-v1:${kind}:${number}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

const rawCodes = /\b(?:pending_verification|pending_review|changes_requested|consent_withdrawn|needs_update|under_review|company_interview|awaiting_feedback|no_company_response|not_selected|in_person|no_show|profile_updated|profile_activated|outcome_confirmed|referral_revoked|active|inactive|incomplete|suspended|archived|draft|published|paused|rejected|referred|scheduled|completed|hired|withdrawn|unavailable|available|feedback)\b/i;

async function check(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(new RegExp(`${canonicalFixturePath(path).split("?")[0]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?|$)`));
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(rawCodes);
  await expect(page.getByText("No pudimos cargar esta pantalla", { exact: true })).toHaveCount(0);
}

test("público: navegación, búsqueda y registros con textos españoles", async ({ page }) => {
  for (const path of ["/", "/ofertas", "/?registro=candidato", "/?registro=empresa", "/recover"])
    await check(page, path);
});

for (const role of ["candidate", "company", "admin"] as const) {
  test(`${role}: vistas, estados, historiales y controles en español`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill(`${role}1@example.invalid`);
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL({ candidate: /\/dashboard$/, company: /\/empresa$/, admin: /\/account$/ }[role]);
    const paths = role === "candidate" ? ["/account", "/account?section=perfil", "/account?section=ofertas", "/account?section=postulaciones"]
      : role === "company" ? ["/account", "/empresa", "/empresa/perfil", "/empresa/ofertas",
        `/empresa/ofertas/${fixtureId("opening", 1)}`]
        : ["/account", "/admin/candidates", `/admin/candidates/${fixtureId("profile", 2)}`, "/admin/candidates/assisted",
          "/admin/empresas", `/admin/empresas/${fixtureId("business", 2)}`, "/admin/openings",
          `/admin/openings/${fixtureId("opening", 2)}`, "/admin/participations",
          `/admin/participations/${fixtureId("participation", 3)}`, "/admin/metrics"];
    for (const path of paths) await check(page, path);
    if (role === "candidate") {
      await page.goto("/account?section=perfil");
      await expect(page.getByText("Seleccionar archivo", { exact: true })).toBeVisible();
      await expect(page.getByText("Ningún archivo seleccionado", { exact: true })).toBeVisible();
    }
    if (role === "admin") {
      await page.goto("/admin/openings");
      await expect(page.getByRole("option", { name: "Pendiente de revisión", exact: true })).toHaveAttribute("value", "pending_review");
      await page.goto("/admin/candidates");
      await expect(page.getByRole("option", { name: "Disponible", exact: true })).toHaveAttribute("value", "available");
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `test-results/spanish-${role}-mobile.png`, fullPage: true });
  });
}
