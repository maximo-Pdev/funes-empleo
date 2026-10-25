// Standalone proof: actual React account markup + actual styles; mocked fictitious data only.
// Never starts Next, writes .next, authenticates, submits forms or accesses a database.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "@playwright/test";

const scratch = path.join(process.env.LOCALAPPDATA, "hermes", "cache", "scratch");
await mkdir(scratch, { recursive: true });
const output = process.env.CANDIDATE_WORKSPACE_OUTPUT_DIR ?? await mkdtemp(path.join(scratch, "candidate-workspace-"));
await mkdir(output, { recursive: true });
const generation = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/components/candidate/candidate-pages.test.tsx", "-t", "renders shared candidate canvas fixture"], {
  env: { ...process.env, CANDIDATE_WORKSPACE_FIXTURE_DIR: output }, encoding: "utf8",
});
await writeFile(path.join(output, "composition.txt"), generation.stdout + generation.stderr);
// Continue to computed geometry even on composition RED, so missing styles are independently visible.
const globals = await readFile("src/app/globals.css", "utf8");
const globalCss = (await postcss([tailwind({ optimize: false })]).process(globals, { from: path.resolve("src/app/globals.css") })).css;
const sections = ["dashboard", "perfil", "postulaciones", "ofertas", "cuenta"];
const widths = [1440, 1024, 768, 390, 320];
const motionPreferences = ["no-preference", "reduce"];
const results = [];
const failures = [];
const browser = await chromium.launch();
try {
  for (const section of sections) {
    const fixture = JSON.parse(await readFile(path.join(output, `${section}.json`), "utf8"));
    for (const width of widths) for (const reducedMotion of motionPreferences) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
      // Local font assets are served from disk; all other requests are blocked.
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.hostname === "fixture.invalid" && url.pathname.startsWith("/fonts/funes/")) {
          await route.fulfill({ body: await readFile(path.join("public", url.pathname)), contentType: "font/ttf" });
        } else if (url.hostname === "fixture.invalid" && url.pathname === "/brand/funes-navbar-emblem.svg") {
          await route.fulfill({ body: await readFile("public/brand/funes-navbar-emblem.svg"), contentType: "image/svg+xml" });
        } else await route.abort();
      });
      await page.setContent(`<base href="https://fixture.invalid/"><style>${globalCss}\n${fixture.css}</style>${fixture.html}`);
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const main = document.querySelector("main");
        const canvas = main.firstElementChild;
        const sidebar = document.querySelector("aside");
        const nav = document.querySelector("header[data-home]");
        const rect = el => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        const style = el => { const s = getComputedStyle(el); return { color: s.backgroundColor, image: s.backgroundImage, animation: s.animationName, minHeight: s.minHeight, maxHeight: s.maxHeight, height: s.height, paddingTop: s.paddingTop, paddingBottom: s.paddingBottom, position: s.position, overflowY: s.overflowY, maxWidth: s.maxWidth }; };
        return { main: rect(main), canvas: rect(canvas), sidebar: rect(sidebar), nav: rect(nav), firstLink: rect(sidebar.querySelector("a")), workspace: style(main.parentElement), mainStyle: style(main), canvasStyle: style(canvas), sidebarStyle: style(sidebar), navStyle: style(nav), overflow: document.documentElement.scrollWidth > innerWidth, animations: main.getAnimations({ subtree: true }).length, slot: canvas.dataset.slot };
      });
      try {
        assert.equal(geometry.mainStyle.color, "rgb(7, 74, 31)", "flat municipal green exterior");
        assert.equal(geometry.mainStyle.image, "none", "no gradient");
        assert.equal(geometry.mainStyle.animation, "none");
        assert.equal(geometry.animations, 0, "no canvas/exterior animations");
        assert.equal(geometry.canvasStyle.color, "rgb(255, 255, 255)");
        assert.equal(geometry.canvasStyle.maxWidth, "960px");
        assert.equal(geometry.canvasStyle.minHeight, "0px", "canvas must not stretch to viewport");
        assert.equal(geometry.canvasStyle.maxHeight, "none");
        assert.equal(geometry.canvasStyle.overflowY, "visible");
        assert.ok(geometry.canvas.width <= 960);
        const gutter = width < 768 ? 16 : 24;
        assert.equal(geometry.canvas.width, Math.min(960, geometry.main.width - gutter * 2), "canvas uses the full available width up to 960px");
        assert.ok(Math.abs((geometry.canvas.left - geometry.main.left) - (geometry.main.right - geometry.canvas.right)) < 1, "centered within main");
        assert.ok(geometry.canvas.left - geometry.main.left >= gutter - 1);
        assert.equal(geometry.overflow, false, "no horizontal overflow");
        assert.equal(geometry.slot, section === "perfil" ? "profile-canvas" : "candidate-canvas");
        assert.equal(geometry.navStyle.position, "fixed");
        assert.ok(["rgba(255, 255, 255, 0.85)", "color(srgb 1 1 1 / 0.85)"].includes(geometry.navStyle.color), "existing 85%-white frosted navbar preserved");
        const contentFits = await page.evaluate(() => {
          const canvas = document.querySelector("main").firstElementChild;
          const bounds = canvas.getBoundingClientRect();
          return [...canvas.querySelectorAll('h1, input:not([type="hidden"]), select, textarea, button')].every(el => {
            const r = el.getBoundingClientRect();
            return r.width === 0 || (r.left >= bounds.left - 1 && r.right <= bounds.right + 1 && r.bottom <= bounds.bottom + 1);
          });
        });
        assert.ok(contentFits, "heading and controls remain inside white canvas");
        const accountLink = page.locator('aside nav a').filter({ hasText: /^Cuenta$/ });
        assert.equal(await accountLink.getAttribute("href"), "/dashboard?section=cuenta");
        assert.equal(await page.locator("aside").getByRole("button", { name: "Cerrar sesión" }).count(), 1);
        assert.equal(await page.locator("main").getByRole("button", { name: "Cerrar sesión" }).count(), 0);
        assert.equal(await page.locator("aside").getByRole("link", { name: "Cambiar contraseña" }).count(), 0);
        if (section === "cuenta") {
          assert.equal(await accountLink.getAttribute("aria-current"), "page");
          const password = page.locator("main").getByRole("link", { name: "Cambiar contraseña" });
          assert.equal(await password.count(), 1);
          assert.equal(await password.getAttribute("href"), "/update-password");
          await password.scrollIntoViewIfNeeded();
          const bounds = await password.boundingBox();
          assert.ok(bounds.height >= 44 && bounds.width > 0, "password shortcut retains its touch target");
          await password.focus();
          assert.equal(await password.evaluate(el => el === document.activeElement), true);
        } else {
          assert.equal(await page.getByRole("link", { name: "Cambiar contraseña" }).count(), 0);
        }
        const navOverlays = await page.evaluate(() => {
          const nav = document.querySelector("header[data-home]");
          const r = nav.getBoundingClientRect();
          return nav.contains(document.elementFromPoint(10, r.top + 10));
        });
        assert.ok(navOverlays, "navbar overlays workspace/sidebar rather than being covered");
        if (width >= 768) {
          assert.equal(geometry.main.top, 0, "green starts behind navbar at top0");
          assert.equal(geometry.sidebar.top, 0, "sidebar surface starts at top0");
          assert.equal(geometry.sidebarStyle.position, "fixed");
          assert.equal(geometry.sidebarStyle.paddingTop, "96px");
          assert.ok(geometry.firstLink.top >= geometry.nav.bottom + 31, "sidebar links clear navbar");
          assert.equal(geometry.mainStyle.paddingTop, "96px");
          assert.equal(geometry.canvas.top, geometry.nav.bottom + 32, "white canvas begins below navbar");
          assert.equal(geometry.nav.top, 0);
        } else {
          assert.equal(geometry.sidebarStyle.position, "static");
          assert.equal(geometry.sidebar.top, 0);
          assert.ok(geometry.main.top >= geometry.sidebar.bottom);
          assert.equal(geometry.mainStyle.paddingTop, "24px", "no desktop navbar gap on mobile");
          assert.equal(geometry.nav.bottom, 900);
          assert.equal(geometry.workspace.paddingBottom, "88px");
          await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          const clearance = await page.evaluate(() => document.querySelector("header[data-home]").getBoundingClientRect().top - document.querySelector("main").firstElementChild.getBoundingClientRect().bottom);
          assert.ok(clearance >= 23, "last content scrolls above bottom navbar");
          // Real env() is zero in headless desktop Chromium. Also prove the additive safe-area expression.
          assert.match(fixture.css, /padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom, 0px\)\)/);
        }
        // A temporary geometric probe (not business data) proves natural growth without an inner scroll container.
        const growth = await page.evaluate(() => {
          const canvas = document.querySelector("main").firstElementChild;
          const before = canvas.getBoundingClientRect().height;
          const probe = document.createElement("div"); probe.style.height = "1200px"; canvas.append(probe);
          const delta = canvas.getBoundingClientRect().height - before; probe.remove(); return delta;
        });
        assert.ok(growth >= 1199, "canvas naturally grows with content");
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: path.join(output, `${section}-${width}-${reducedMotion}.png`), fullPage: true });
        results.push({ section, width, reducedMotion, geometry });
      } catch (error) { failures.push({ section, width, reducedMotion, error: error.message, geometry }); }
      await page.close();
    }
  }
} finally { await browser.close(); }
const sourceHashes = {};
for (const file of ["src/app/(auth)/account/candidate-account.tsx", "src/app/(auth)/account/account.module.css", "src/app/(public)/home.module.css", "src/app/globals.css"]) sourceHashes[file] = createHash("sha256").update(await readFile(file)).digest("hex");
const report = { fixture: "actual component markup / real CSS; mocked fictitious services, no live account proof", passed: results.length, failed: failures.length, compositionExitCode: generation.status, output, sourceHashes, results, failures };
await writeFile(path.join(output, "results.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, results: results.map(({ section, width, reducedMotion }) => ({ section, width, reducedMotion })), failures: failures.map(({ section, width, reducedMotion, error }) => ({ section, width, reducedMotion, error })) }, null, 2));
assert.equal(generation.status, 0, "composition fixture tests must pass");
assert.equal(failures.length, 0, "all candidate geometries must pass");
assert.equal(results.length, sections.length * widths.length * motionPreferences.length);
