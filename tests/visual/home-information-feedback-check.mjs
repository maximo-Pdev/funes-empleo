// Style-only DOM fixtures, not provider responses. Never submit account forms.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { Info } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const informationIcon = renderToStaticMarkup(createElement(Info, { size: 16, "aria-hidden": true }));

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3012";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname));
const browser = await chromium.launch();
const checks = [];
const blockedRequests = [];
try {
  const page = await browser.newPage();
  await page.route("**/*", route => {
    if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
    blockedRequests.push(route.request().method());
    return route.abort();
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ["login", "candidate", "company"]) {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      if (mode !== "login") await page.getByRole("button", { name: "Registrarse", exact: true }).click();
      if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      const feedback = page.locator('form p[role="status"], form p[role="alert"]').last();
      const read = () => feedback.evaluate(element => ({
        color: getComputedStyle(element).color,
        generatedIcon: getComputedStyle(element, "::before").content,
        icon: element.querySelector("svg.lucide-info")?.getAttribute("aria-hidden"),
        iconColor: element.querySelector("svg") ? getComputedStyle(element.querySelector("svg")).color : null,
        display: getComputedStyle(element).display,
        focused: document.activeElement === element,
        live: element.getAttribute("aria-live"),
      }));
      assert.equal((await read()).display, "none", "Empty feedback stays hidden");
      assert.equal((await read()).icon, undefined, "No decorative icon without a message");
      const expectedBlue = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--color-feedback-info)";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      assert.equal(expectedBlue, "rgb(87, 88, 214)", "The global token matches #5758D6");
      await feedback.evaluate((element, icon) => {
        element.setAttribute("role", "status");
        // Trusted static Lucide markup above; no user or provider HTML is used.
        element.innerHTML = icon;
        element.append(document.createTextNode("Si los datos son válidos, recibirás un enlace para verificar tu correo. Revisá también spam."));
        element.focus();
      }, informationIcon);
      const info = await read();
      assert.equal(info.color, expectedBlue, `${width}/${mode}: informational feedback is blue`);
      assert.equal(info.icon, "true", "A decorative Lucide Info SVG is present");
      assert.equal(info.iconColor, expectedBlue, "The SVG inherits the informational color");
      assert.ok(["none", "normal"].includes(info.generatedIcon), "No generated text icon");
      assert.ok(info.focused, "Existing feedback focus target is preserved");
      assert.equal(info.live, "polite");
      if (width === 390 && mode === "candidate" && process.env.FEEDBACK_SCREENSHOT) {
        await feedback.screenshot({ path: process.env.FEEDBACK_SCREENSHOT });
      }
      await feedback.evaluate((element, mode) => {
        element.setAttribute("role", mode === "login" ? "status" : "alert");
        if (mode === "login") element.classList.add("text-red-700");
        element.textContent = "Revisá los datos ingresados.";
      }, mode);
      const error = await read();
      assert.equal(error.color, "rgb(140, 36, 48)", "Errors stay red");
      assert.equal(error.icon, undefined, "Errors do not receive the information icon");
      await feedback.evaluate(element => { element.textContent = ""; });
      assert.equal((await read()).display, "none", "Cleared feedback collapses again");
      checks.push({ width, mode, status: "PASS" });
    }
  }
  assert.deepEqual(blockedRequests, [], "No account mutations attempted");
  console.log(JSON.stringify({ status: "PASS", fixtureOnly: true, checks, blockedRequests }));
} finally {
  await browser.close();
}
