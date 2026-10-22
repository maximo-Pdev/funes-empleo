// Read-only visual check: no acceptance reset and no form submission.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];
async function capturePanelResize(page, label) {
  return page.evaluate(buttonLabel => new Promise(resolve => {
    const panel = document.querySelector('section[aria-label="Acceso al portal"]');
    const button = [...panel.querySelectorAll("button")].find(el => el.textContent.trim() === buttonLabel);
    const heights = [];
    const until = performance.now() + 550;
    function sample() {
      heights.push(panel.getBoundingClientRect().height);
      if (performance.now() < until) requestAnimationFrame(sample);
      else resolve(heights);
    }
    sample();
    button.click();
  }), label);
}
try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const navbarElement = page.locator("header");
    const navbar = await navbarElement.evaluate(el => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, image: s.backgroundImage, border: s.borderBottomWidth, color: s.borderBottomColor, position: s.position };
    });
    assert.deepEqual(navbar, { background: "rgb(255, 255, 255)", image: "none", border: "1px", color: "rgb(134, 141, 152)", position: "fixed" });
    assert.equal(await navbarElement.getAttribute("aria-hidden"), width < 768 ? "false" : "true");
    assert.equal(await navbarElement.evaluate(el => getComputedStyle(el).visibility), width < 768 ? "visible" : "hidden");
    const mainTop = await page.locator("main").evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(() => scrollTo({ top: 120, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("header")?.getAttribute("data-visible") === "true" && getComputedStyle(document.querySelector("header")).transform === "matrix(1, 0, 0, 1, 0, 0)");
    assert.equal(await navbarElement.getAttribute("aria-hidden"), "false");
    assert.equal(await page.locator("main").evaluate(el => el.getBoundingClientRect().top + scrollY), mainTop);
    assert.equal(await navbarElement.evaluate(el => getComputedStyle(el).transitionDuration.split(",")[0].trim()), width < 768 ? "0s" : "0.28s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await navbarElement.evaluate(el => getComputedStyle(el).transitionDuration), "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(mobile => document.querySelector("header")?.getAttribute("data-visible") === (mobile ? "true" : "false") && getComputedStyle(document.querySelector("header")).visibility === (mobile ? "visible" : "hidden"), width < 768);
    assert.equal(await navbarElement.evaluate(el => el.inert), width >= 768);
    const headline = page.locator("h1");
    assert.equal(await headline.evaluate(el => getComputedStyle(el).color), "rgb(255, 255, 255)");
    assert.equal(await page.locator("[data-hero-slide]").count(), 0);
    const ribbons = page.locator("canvas[data-ribbons]");
    assert.equal(await ribbons.count(), 1);
    assert.equal(await ribbons.getAttribute("aria-hidden"), "true");
    assert.equal(await ribbons.evaluate(el => getComputedStyle(el).pointerEvents), "none");
    await page.waitForFunction(() => document.querySelector("canvas[data-ribbons]")?.getAttribute("data-motion") === "animated");
    const movingFrame = await ribbons.evaluate(el => el.toDataURL());
    await page.waitForFunction(frame => document.querySelector("canvas[data-ribbons]").toDataURL() !== frame, movingFrame);
    assert.ok(await ribbons.evaluate(el => el.getContext("2d").getImageData(0, 0, el.width, el.height).data.some((value, index) => index % 4 === 3 && value > 0)), "Ribbons have visible painted pixels");
    assert.equal(await page.getByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ }).count(), 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.querySelector("canvas[data-ribbons]")?.getAttribute("data-motion") === "static");
    const staticFrame = await ribbons.evaluate(el => el.toDataURL());
    await page.waitForTimeout(150);
    assert.equal(await ribbons.evaluate(el => el.toDataURL()), staticFrame, "Reduced motion freezes a visible frame");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const access = page.getByRole("region", { name: "Acceso al portal" });
    assert.match(await access.evaluate(el => getComputedStyle(el).backgroundImage), /rgb\(255, 255, 255\)/);
    assert.equal(await access.evaluate(el => getComputedStyle(el.parentElement.parentElement).backgroundColor), width > 767 ? "rgb(7, 74, 31)" : "rgba(0, 0, 0, 0)");
    assert.equal(await page.getByText("Portal Municipal de Empleo de Funes", { exact: true }).count(), 0);
    assert.equal(await access.evaluate(el => getComputedStyle(el).transitionProperty), "height");
    assert.equal(await access.evaluate(el => getComputedStyle(el).transitionDuration), "0.36s");
    const growth = await capturePanelResize(page, "Registrarse");
    assert.ok(growth.at(-1) > growth[0] + 20, "Registration expands the card");
    assert.ok(growth.some(height => height > growth[0] + 1 && height < growth.at(-1) - 1), "Expansion has intermediate animation frames");
    const roles = page.getByRole("group", { name: "Tipo de cuenta", exact: true });
    assert.match(await roles.evaluate(el => getComputedStyle(el).backgroundImage), /linear-gradient/);
    assert.equal(await roles.locator("div").first().evaluate(el => getComputedStyle(el).justifyContent), "center");
    const shrinkage = await capturePanelResize(page, "Iniciar sesión");
    assert.ok(shrinkage.at(-1) < shrinkage[0] - 20, "Login shrinks the card");
    assert.ok(shrinkage.some(height => height < shrinkage[0] - 1 && height > shrinkage.at(-1) + 1), "Shrinkage has intermediate animation frames");
    const centering = await access.evaluate(el => {
      const group = el.parentElement;
      const area = group.parentElement;
      const g = group.getBoundingClientRect();
      const a = area.getBoundingClientRect();
      const s = getComputedStyle(area);
      return Math.abs(g.top + g.height / 2 - (a.top + parseFloat(s.paddingTop) + (a.height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)) / 2));
    });
    if (width >= 768) assert.ok(centering < 1, "Desktop login card remains vertically centered");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await access.evaluate(el => getComputedStyle(el).transitionDuration), "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    assert.equal(await page.getByRole("button", { name: "Iniciar sesión", pressed: true }).evaluate(el => getComputedStyle(el).backgroundColor), "rgb(38, 43, 53)");
    const action = page.getByRole("link", { name: "Ver ofertas disponibles" });
    const actionBox = await action.boundingBox();
    assert.ok(Math.abs(actionBox.x + actionBox.width / 2 - width / 2) < 1, "Offers action is horizontally centered");
    await action.click();
    await page.waitForFunction(() => location.hash === "#ofertas-disponibles" && Math.abs(document.getElementById("ofertas-disponibles").getBoundingClientRect().top - 104) < 2);
    assert.equal(await page.locator("#ofertas-disponibles").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
    assert.equal(await page.locator("#ofertas-disponibles").evaluate(el => getComputedStyle(el).borderTopWidth), "0px");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator("html").evaluate(el => getComputedStyle(el).scrollBehavior), "auto");
    await page.evaluate(() => { history.replaceState(null, "", location.pathname); scrollTo({ top: 0, behavior: "instant" }); });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const bodyFont = await page.locator("body").evaluate(el => getComputedStyle(el).fontFamily);
    assert.match(bodyFont, /Be Vietnam/, "Body must use the municipal theme family");
    assert.match(await page.locator("h1").first().evaluate(el => getComputedStyle(el).fontFamily), /Sora/);
    for (const mode of ["login", "candidate", "company"]) {
      if (mode === "candidate") await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
      if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('button[aria-pressed="true"]')).backgroundColor === "rgb(38, 43, 53)");
      const input = page.locator('form input[type="email"]').first();
      assert.equal(await page.locator(".form-compact form").evaluate(el => getComputedStyle(el).rowGap), "16px");
      if (mode === "login") {
        const spacing = await input.evaluate(el => {
          const label = el.labels[0];
          const next = el.form.querySelector('input[name="password"]').parentElement.parentElement;
          return { labelGap: el.getBoundingClientRect().top - label.getBoundingClientRect().bottom, fieldGap: next.getBoundingClientRect().top - el.parentElement.getBoundingClientRect().bottom };
        });
        assert.equal(spacing.labelGap, 6);
        assert.equal(spacing.fieldGap, 16);
        assert.equal(await page.getByText("Entre 6 y 128 caracteres. No compartas tu contraseña.", { exact: true }).count(), 1);
        assert.equal(await page.getByText("No compartas tu contraseña.", { exact: true }).count(), 0);
      } else {
        assert.equal(await page.locator("form [data-form-field]").first().evaluate(el => getComputedStyle(el.querySelector("label")).textTransform), "uppercase");
      }
      const style = await input.evaluate(el => {
        const s = getComputedStyle(el);
        return { height: s.height, radius: s.borderRadius, top: s.borderTopWidth, bottom: s.borderBottomWidth, color: s.color, font: s.fontFamily, padding: s.padding, border: s.borderBottomColor };
      });
      assert.equal(style.height, "44px");
      assert.equal(style.radius, "0px");
      assert.equal(style.top, "0px");
      assert.equal(style.bottom, "1px");
      assert.equal(style.border, "rgb(38, 43, 53)");
      assert.equal(style.color, "rgb(73, 80, 87)");
      assert.equal(await page.locator("form label").first().evaluate(el => getComputedStyle(el).color), "rgb(38, 43, 53)");
      assert.match(style.font, /Be Vietnam/);
      assert.equal(await page.locator("form label").first().evaluate(el => getComputedStyle(el).textTransform), "uppercase");
      await input.focus();
      assert.equal(await input.evaluate(el => getComputedStyle(el).outlineStyle), "solid");
      const submit = page.locator('form button[type="submit"]').first();
      assert.equal(await submit.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(38, 43, 53)");
      assert.match(await submit.evaluate(el => getComputedStyle(el).fontFamily), /Sora/);
      const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true }).first();
      await toggle.click();
      const shown = page.getByRole("button", { name: "Ocultar contraseña", exact: true }).first();
      const box = await shown.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, "Password toggle keeps its accessible target");
      await shown.click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "No horizontal page overflow");
      results.push({ width, mode, ...style });
    }
    await page.waitForFunction(() => {
      const panel = document.querySelector('section[aria-label="Acceso al portal"]');
      return [...panel.getAnimations(), ...panel.parentElement.getAnimations()].every(animation => animation.playState !== "running");
    });
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("canvas[data-ribbons]")?.getAttribute("data-motion") === "paused", undefined, { timeout: 3000 }).catch(async error => {
      console.error(JSON.stringify(await ribbons.evaluate(el => ({ width: innerWidth, height: innerHeight, bottom: el.getBoundingClientRect().bottom, top: el.getBoundingClientRect().top, scrollY, scrollHeight: document.documentElement.scrollHeight, motion: el.dataset.motion }))));
      throw error;
    });
    const offscreenFrame = await ribbons.evaluate(el => el.toDataURL());
    await page.waitForTimeout(150);
    assert.equal(await ribbons.evaluate(el => el.toDataURL()), offscreenFrame, "Fully off-screen ribbons stop rendering");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("canvas[data-ribbons]")?.getAttribute("data-motion") === "animated");
    // Exercise generic controls without real business data or a new application route.
    await page.evaluate(() => {
      const form = document.createElement("form");
      form.id = "visual-control-fixture";
      // This is a fixed, fictitious test fixture; no external input is interpolated.
      form.innerHTML = '<label for="visual-note">Nota</label><textarea id="visual-note" rows="3"></textarea><select aria-label="Ejemplo"><option>Ejemplo</option></select><input type="checkbox" aria-label="Confirmar"><input type="file" aria-label="Archivo"><input aria-label="Error" aria-invalid="true"><button type="submit" class="bg-red-800">Archivar</button>';
      document.body.append(form);
    });
    const fixture = page.locator("#visual-control-fixture");
    assert.equal(await fixture.locator("textarea").evaluate(el => getComputedStyle(el).resize), "vertical");
    assert.equal(await fixture.locator("select").evaluate(el => getComputedStyle(el).borderTopWidth), "0px");
    assert.notEqual(await fixture.locator('[type="checkbox"]').evaluate(el => getComputedStyle(el).height), "44px");
    assert.notEqual(await fixture.locator('[type="file"]').evaluate(el => getComputedStyle(el).height), "44px");
    assert.equal(await fixture.locator('[aria-invalid="true"]').evaluate(el => getComputedStyle(el).borderBottomColor), "rgb(153, 27, 27)");
    assert.notEqual(await fixture.locator("button").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(38, 43, 53)", "Danger actions keep red");
    assert.equal(await page.evaluate(async () => {
      // Request these exact weights: an unused font face is not loaded by fonts.ready.
      await Promise.all([document.fonts.load('400 16px "Be Vietnam"'), document.fonts.load('700 16px "Sora"')]);
      return document.fonts.check('400 16px "Be Vietnam"') && document.fonts.check('700 16px "Sora"');
    }), true);
    await page.evaluate(() => scrollTo({ top: 100, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("header")?.getAttribute("data-visible") === "true");
    const brand = page.getByRole("link", { name: "Ir al sitio de la Municipalidad de Funes" });
    assert.equal(await brand.getAttribute("href"), "https://funes.gob.ar/");
    assert.ok(await brand.locator("img").evaluate(el => el.complete && el.naturalWidth > 0));
    await page.route("https://funes.gob.ar/", route => route.fulfill({ contentType: "text/html", body: "<title>Municipal destination test</title>" }));
    await brand.click();
    await page.waitForURL("https://funes.gob.ar/");
  }
  console.log(JSON.stringify({ status: "PASS", checks: results }, null, 2));
} finally {
  await browser.close();
}
