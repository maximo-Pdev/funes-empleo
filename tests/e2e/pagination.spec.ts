import { expect, test } from "@playwright/test";
import { loginFixture } from "./fixtures/quality";
import manifest from "../fixtures/acceptance-manifest.json" with { type: "json" };
test.use({trace:"off",screenshot:"off"});
test("SC-008A: entradas y conteos de paginación, sin acreditar latencia alojada", async ({page})=>{
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"),"Solo fixture local");
  await loginFixture(page,"admin");
  for (const [route,label,entry] of [
    ["openings","Ofertas",manifest.sc008a.openingList],
    ["empresas","Empresas",manifest.sc008a.companyList],
  ] as const) {
    await page.goto(`/admin/${route}?status=${entry.status}&page=1`);
    await expect(page.getByRole("heading",{name:`${label}: ${entry.expectedTotal}`,exact:true})).toBeVisible();
    const first=await page.locator("main li a").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("href")));
    expect(first).toHaveLength(entry.pageSize);
    await page.getByRole("link",{name:"Siguiente",exact:true}).click();
    await expect(page).toHaveURL(/page=2/);
    const second=await page.locator("main li a").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("href")));
    expect(second).toHaveLength(entry.expectedRows);
    expect(second.some(id=>first.includes(id))).toBe(false);
    await page.goto(`/admin/${route}?status=INEXISTENTE`);
    await expect(page.getByRole("alert")).toBeVisible();
  }
});
