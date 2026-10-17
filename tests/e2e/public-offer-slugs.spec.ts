import { expect, test } from "@playwright/test";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { loginFixture } from "./fixtures/quality";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());
const slugPath = /^\/ofertas\/[a-z0-9]+(?:-[a-z0-9]+)*-[a-f0-9]{16}$/;
const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

test("ofertas: enlaces canónicos sin UUID y compatibilidad de enlaces antiguos", async ({ page, request }) => {
  await page.goto("/");
  const featured = page.locator('a[href^="/ofertas/"]').first();
  await expect(featured).toHaveAttribute("href", slugPath);
  await page.goto("/ofertas");
  const link = page.locator('a[href^="/ofertas/"]').first();
  const path = await link.getAttribute("href");
  expect(path).toMatch(slugPath);
  if (!path) throw new Error("Falta oferta ficticia pública.");
  await link.click();
  await expect(page).toHaveURL(`http://127.0.0.1:3000${path}`);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const apply = page.getByRole("link", { name: "Postularme con mi cuenta", exact: true });
  await expect(apply).toHaveAttribute("href", `/candidato/ofertas?oferta=${path.slice("/ofertas/".length)}`);
  expect(await apply.getAttribute("href")).not.toMatch(uuid);
  const id = runLocalMaintenanceSql(`select id from public.job_openings where public_slug='${path.slice("/ofertas/".length)}'`);
  const legacy = await request.get(`/ofertas/${id}`, { maxRedirects: 0 });
  expect([200, 308]).toContain(legacy.status());
  if (legacy.status() === 308) {
    expect(new URL(legacy.headers().location!, "http://127.0.0.1:3000").pathname).toBe(path);
  } else {
    const refresh = (await legacy.text()).match(/<meta[^>]*http-equiv="refresh"[^>]*>/g) ?? [];
    expect(refresh).toEqual(expect.arrayContaining([expect.stringContaining(`content="0;url=${path}"`)]));
  }
  expect(legacy.headers()["cache-control"]).toContain("no-store");
  await page.goto(`/ofertas/${id}`);
  await expect(page).toHaveURL(`http://127.0.0.1:3000${path}`);
});

test("ofertas: no públicas, inexistentes e inválidas no revelan slug ni redirigen", async ({ page, request }) => {
  const reference = runLocalMaintenanceSql("select id||'|'||public_slug from public.job_openings where status='closed' and archived_at is null limit 1");
  const [id, slug] = reference.split("|");
  if (!id || !slug) throw new Error("Falta oferta cerrada ficticia local.");
  for (const value of [id, slug, "inexistente-0123456789abcdef", "invalido"]) {
    const response = await request.get(`/ofertas/${value}`, { maxRedirects: 0 });
    expect([200, 404]).toContain(response.status());
    expect(response.headers().location).toBeUndefined();
    const body = await response.text();
    expect(body).not.toContain('http-equiv="refresh"');
    if (value === id) expect(body).not.toContain(slug);
    await page.goto(`/ofertas/${value}`);
    await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
    const robots = page.locator('head meta[name="robots"]');
    await expect(robots.first()).toHaveAttribute("content", "noindex");
    for (const metadata of await robots.all()) await expect(metadata).toHaveAttribute("content", "noindex");
  }
});

test("candidato: selección por slug y enlace UUID antiguo conservan la misma oferta", async ({ page }) => {
  const [id, slug] = runLocalMaintenanceSql("select (item->>'id')||'|'||(item->>'slug') from jsonb_array_elements(public.published_offers(1,1,null)->'items') item").split("|");
  if (!id || !slug) throw new Error("Falta oferta ficticia pública.");
  await loginFixture(page, "candidate");
  await page.goto(`/candidato/ofertas?oferta=${slug}`);
  const selection = page.getByRole("region", { name: "Oferta elegida", exact: true });
  await expect(selection.getByRole("heading", { level: 2 })).toBeVisible();
  const title = await selection.getByRole("heading", { level: 2 }).textContent();
  expect(await selection.locator('input[name="openingId"]').inputValue()).toBe(id);
  await page.goto(`/candidato/ofertas?oferta=${id}`);
  await expect(page).toHaveURL(`http://127.0.0.1:3000/candidato/ofertas?oferta=${slug}`);
  await expect(selection.getByRole("heading", { level: 2 })).toHaveText(title!);
  for (const link of await page.locator('a[href^="/ofertas/"]').all()) {
    await expect(link).toHaveAttribute("href", slugPath);
  }
});
