// Authenticated HomeHero markup/CSS fixture, not a real Auth session.
// HomePage retains this hero for every role. No Auth or database access.
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "@playwright/test";

const output = await mkdtemp(path.join(tmpdir(), "funes-home-session-"));
const generated = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/components/home-access-panel.test.tsx", "-t", "keeps verified panel access", "--maxWorkers=2"], {
  env: { ...process.env, HOME_SESSION_FIXTURE_DIR: output }, encoding: "utf8",
});
await writeFile(path.join(output, "composition.log"), generated.stdout + generated.stderr);
assert.equal(generated.status, 0, `Component fixture generation failed: ${output}`);
const globals = (await postcss([tailwind({ optimize: false })]).process(await readFile("src/app/globals.css", "utf8"), { from: path.resolve("src/app/globals.css") })).css;
const browser = await chromium.launch();
const results = [];
try {
  for (const role of ["candidate", "company", "admin"]) {
    const fixture = JSON.parse(await readFile(path.join(output, `${role}.json`), "utf8"));
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.hostname === "fixture.invalid" && url.pathname.startsWith("/fonts/funes/")) {
          await route.fulfill({ body: await readFile(path.join("public", url.pathname)), contentType: "font/ttf" });
        } else if (url.hostname === "fixture.invalid" && url.pathname === "/brand/funes-navbar-emblem.svg") {
          await route.fulfill({ body: await readFile("public/brand/funes-navbar-emblem.svg"), contentType: "image/svg+xml" });
        } else await route.abort();
      });
      await page.setContent(`<base href="https://fixture.invalid/"><style>${globals}\n${fixture.css}</style>${fixture.html}`);
      await page.evaluate(() => document.fonts.ready);
      const access = page.getByRole("region", { name: "Acceso al portal" });
      assert.equal(await access.getByRole("group", { name: "Opciones de acceso" }).count(), 0);
      assert.equal(await access.getByRole("button").count(), 1);
      assert.equal(await access.getByRole("button", { name: "Cerrar sesión", exact: true }).count(), 1);
      assert.equal(await access.locator("form").count(), 1);
      assert.equal(await access.locator('input:not([type="hidden"]), select, textarea').count(), 0);
      assert.equal(await access.getByRole("heading", { name: "Continuá en el portal" }).count(), 1);
      assert.equal(await access.getByRole("link", { name: "Ver ofertas", exact: true }).getAttribute("href"), "/ofertas");
      assert.equal(await access.getByRole("status").textContent(), "Tu sesión está activa. Continuá desde tu panel.");
      const link = access.getByRole("link", { name: fixture.label });
      assert.equal(await link.getAttribute("href"), fixture.href);
      await access.scrollIntoViewIfNeeded();
      await access.focus();
      await page.keyboard.press("Tab");
      assert.equal(await link.evaluate(el => el === document.activeElement), true);
      const styles = await access.getByRole("status").evaluate(el => ({ color: getComputedStyle(el).color, icon: getComputedStyle(el.querySelector("svg")).color }));
      assert.equal(styles.color, "rgb(73, 80, 87)");
      assert.equal(styles.icon, styles.color);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `${role}-${width}.png`), fullPage: true });
      results.push({ role, width, ...styles, href: fixture.href });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ checks: results.length, results, output }, null, 2));
