// Actual component markup/CSS with fictitious services. No login, database or form submissions.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "@playwright/test";

const scratch = path.join(process.env.LOCALAPPDATA, "hermes", "cache", "scratch");
await mkdir(scratch, { recursive: true });
const output = await mkdtemp(path.join(scratch, "admin-workspace-"));
const composition = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/components/admin/admin-pages.test.tsx", "tests/components/accounts/auth-pages.test.tsx"], {
  env: { ...process.env, ADMIN_WORKSPACE_FIXTURE_DIR: output }, encoding: "utf8",
});
await writeFile(path.join(output, "composition.txt"), composition.stdout + composition.stderr);
assert.equal(composition.status, 0, "real admin composition tests pass");
const globals = (await postcss([tailwind({ optimize: false })]).process(await readFile("src/app/globals.css", "utf8"), { from: path.resolve("src/app/globals.css") })).css;
const browser = await chromium.launch();
const results = [];
const failures = [];
try {
  for (const section of ["candidates", "candidate", "assisted", "assisted-detail", "companies", "company", "openings", "opening", "participations", "participation", "imports", "import-new", "import-preview", "metrics", "account", "account-error"]) {
    const fixture = JSON.parse(await readFile(path.join(output, `${section}.json`), "utf8"));
    for (const width of [1440, 1024, 768, 390, 320]) for (const reducedMotion of ["no-preference", "reduce"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.hostname === "fixture.invalid" && (url.pathname.startsWith("/fonts/funes/") || url.pathname === "/brand/funes-navbar-emblem.svg")) {
          await route.fulfill({ body: await readFile(path.join("public", url.pathname)), contentType: url.pathname.endsWith("svg") ? "image/svg+xml" : "font/ttf" });
        } else await route.abort();
      });
      try {
        await page.setContent(`<base href="https://fixture.invalid/"><style>${globals}\n${fixture.css}</style>${fixture.html}`);
        await page.evaluate(() => document.fonts.ready);
        // Expand native disclosures so their complete forms participate in layout.
        await page.evaluate(() => document.querySelectorAll("main details").forEach(details => { details.open = true; }));
        const geometry = await page.evaluate(() => {
          const main = document.querySelector("main");
          const canvas = main.firstElementChild;
          const sidebar = document.querySelector("aside");
          const navbar = document.querySelector("header[data-home]");
          const rect = el => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width }; };
          const style = el => { const s = getComputedStyle(el); return { background: s.backgroundColor, image: s.backgroundImage, animation: s.animationName, maxWidth: s.maxWidth, position: s.position, paddingBottom: s.paddingBottom }; };
          const bounds = canvas.getBoundingClientRect();
          const contained = [...canvas.querySelectorAll('h1,input:not([type="hidden"]),select,textarea,button')].every(el => {
            const r = el.getBoundingClientRect();
            return !r.width || (r.left >= bounds.left - 1 && r.right <= bounds.right + 1 && r.bottom <= bounds.bottom + 1);
          });
          return { main: rect(main), canvas: rect(canvas), sidebar: rect(sidebar), navbar: rect(navbar), firstLink: rect(sidebar.querySelector("a")), mainStyle: style(main), canvasStyle: style(canvas), sidebarStyle: style(sidebar), workspaceStyle: style(main.parentElement), overflow: document.documentElement.scrollWidth > innerWidth, contained };
        });
        assert.equal(geometry.mainStyle.background, "rgb(7, 74, 31)");
        assert.equal(geometry.mainStyle.image, "none");
        assert.equal(geometry.mainStyle.animation, "none");
        assert.equal(geometry.canvasStyle.background, "rgb(255, 255, 255)");
        assert.equal(geometry.canvasStyle.maxWidth, "960px");
        assert.equal(geometry.canvas.width, Math.min(960, geometry.main.width - (width < 768 ? 32 : 48)));
        assert.ok(Math.abs(geometry.canvas.left - geometry.main.left - (geometry.main.right - geometry.canvas.right)) < 1);
        assert.equal(geometry.overflow, false, "no horizontal overflow");
        assert.equal(geometry.contained, true, "forms stay inside the canvas");
        assert.equal(await page.locator("aside").getByRole("button", { name: "Cerrar sesión" }).count(), 1);
        assert.equal(await page.locator("main").getByRole("button", { name: "Cerrar sesión" }).count(), 0);
        if (width >= 768) {
          assert.equal(geometry.sidebar.top, 0);
          assert.equal(geometry.main.top, 0);
          assert.equal(geometry.sidebarStyle.position, "fixed");
          assert.ok(geometry.firstLink.top >= geometry.navbar.bottom + 31);
          assert.equal(geometry.canvas.top, geometry.navbar.bottom + 32);
        } else {
          assert.equal(geometry.sidebarStyle.position, "static");
          assert.equal(geometry.navbar.bottom, 900);
          assert.equal(geometry.workspaceStyle.paddingBottom, "88px");
          await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          assert.ok(await page.evaluate(() => document.querySelector("header[data-home]").getBoundingClientRect().top - document.querySelector("main").firstElementChild.getBoundingClientRect().bottom >= 23));
        }
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        if ([1440, 390].includes(width) && reducedMotion === "no-preference") await page.screenshot({ path: path.join(output, `${section}-${width}.png`), fullPage: true });
        results.push({ section, width, reducedMotion });
      } catch (error) { failures.push({ section, width, reducedMotion, error: error.message }); }
      finally { await page.close(); }
    }
  }
} finally { await browser.close(); }
await writeFile(path.join(output, "results.json"), JSON.stringify({ output, passed: results.length, failed: failures.length, failures }, null, 2));
console.log(JSON.stringify({ output, passed: results.length, failed: failures.length, failures }, null, 2));
assert.equal(failures.length, 0);
assert.equal(results.length, 160);
