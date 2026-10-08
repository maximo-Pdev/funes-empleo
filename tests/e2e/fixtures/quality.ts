import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, type Page } from "@playwright/test";
import { localFixturePassword } from "../../fixtures/credentials.mjs";

export function fixtureId(kind: string, number: number) {
  const h = createHash("md5").update(`funes-demo-v1:${kind}:${number}`).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export async function loginFixture(page: Page, role: "candidate" | "company" | "admin", number = 1) {
  const password = localFixturePassword();
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(`${role}${number}@example.invalid`);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
}
export function protectedPages() {
  const root = join(process.cwd(), "src/app");
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && f.name === "page.tsx")
    .map((f) => relative(root, join(f.parentPath, f.name)).replaceAll("\\", "/"))
    .filter((p) => /^\((admin|candidate|company)\)\//.test(p))
    .map((p) => ({ role: p.match(/^\((\w+)\)/)![1]!, path: "/" + p.replace(/^\([^)]+\)\//, "").replace(/\/page.tsx$/, "")
      .replace("[candidateId]", fixtureId("profile", 1))
      .replace("[companyId]", fixtureId("business", 1))
      .replace("[openingId]", fixtureId("opening", 1))
      .replace("[participationId]", fixtureId("participation", 301))
      .replace("[batchId]", "00000000-0000-4000-8000-000000000001") }));
}
