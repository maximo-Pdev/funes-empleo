import { expect, test } from "@playwright/test";
import { fixtureId, loginFixture } from "./fixtures/quality";
import { persistedReference } from "./fixtures/record-reference";

test.use({ trace: "off", screenshot: "off" });
const uuid = /[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i;
const journeys = {
  admin: ["/account", "/admin/candidates", `/admin/candidates/${fixtureId("profile", 1)}?cv=ok`,
    `/admin/candidates/assisted/${fixtureId("profile", 1)}`, "/admin/empresas", `/admin/empresas/${fixtureId("business", 1)}`,
    "/admin/openings", `/admin/openings/${fixtureId("opening", 1)}?matchPage=1`, "/admin/participations",
    `/admin/participations/${fixtureId("participation", 301)}`, "/admin/imports", "/admin/imports/new", "/admin/metrics"],
  candidate: ["/account?section=perfil", "/candidato/perfil", "/candidato/ofertas", "/candidato/postulaciones"],
  company: ["/account", "/empresa", "/empresa/perfil", "/empresa/ofertas", `/empresa/ofertas/${fixtureId("opening", 1)}`,
    `/company/openings/${fixtureId("opening", 1)}/referrals`],
} as const;
for (const role of ["admin", "candidate", "company"] as const) {
  test(`${role}: textos, enlaces y navegación privada sin UUID`, async ({ page }) => {
    test.setTimeout(120_000);
    await loginFixture(page, role);
    for (const path of journeys[role]) {
      await page.goto(path);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(new URL(page.url()).pathname + new URL(page.url()).search).not.toMatch(uuid);
      expect(await page.locator("body").innerText()).not.toMatch(uuid);
      const links = await page.locator("a[href]").evaluateAll(elements => elements.map(element => element.getAttribute("href")));
      for (const link of links) expect(link).not.toMatch(uuid);
    }
    if (role !== "company") {
      const cv = persistedReference("cv", fixtureId("cv", 1));
      const response = await page.request.get(`/api/cv/${cv}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
      const legacy = await page.request.get(`/api/cv/${fixtureId("cv", 1)}`, { maxRedirects: 0 });
      expect(legacy.status()).toBe(307);
      expect(legacy.headers().location).toBe(`/api/cv/${cv}`);
    }
  });
}
test("público: slugs intactos y empresa ajena sin acceso aunque conozca el código", async ({ page }) => {
  await page.goto("/ofertas");
  expect(await page.locator("body").innerText()).not.toMatch(uuid);
  const publicLink = page.locator('a[href^="/ofertas/"]').first();
  await expect(publicLink).toBeVisible();
  const href = await publicLink.getAttribute("href");
  expect(href).not.toMatch(uuid);
  await publicLink.click();
  expect(page.url()).not.toMatch(uuid);
  await loginFixture(page, "company", 2);
  const opening = persistedReference("opening", fixtureId("opening", 1));
  await page.goto(`/empresa/ofertas/${opening}`);
  await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
  const body = await page.locator("body").innerText();
  await page.goto("/empresa/ofertas/ofe-000000000000000000000000");
  await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
  expect(await page.locator("body").innerText()).toBe(body);
});
test("filtro inválido se puede limpiar sin reenviar identificadores incorrectos", async ({ page }) => {
  await loginFixture(page, "admin");
  await page.goto("/admin/participations?openingId=invalido&candidateId=invalido");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Revisá los filtros");
  await expect(page.locator('input[name="openingId"], input[name="candidateId"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Filtrar casos", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Casos:/ })).toBeVisible();
  expect(new URL(page.url()).searchParams.has("openingId")).toBe(false);
  expect(new URL(page.url()).searchParams.has("candidateId")).toBe(false);
});
test("derivación repetida en query se rechaza, sin elegir silenciosamente un valor", async ({ page }) => {
  await loginFixture(page, "company");
  const opening = persistedReference("opening", fixtureId("opening", 1));
  const referral = persistedReference("referral", fixtureId("referral", 1));
  await page.goto(`/company/openings/${opening}/referrals?referral=${referral}&referral=${referral}`);
  await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
});
