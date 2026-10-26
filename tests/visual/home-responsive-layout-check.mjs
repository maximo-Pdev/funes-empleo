// Read-only homepage layout proof. Never submits forms or resets fixtures.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
const results = [];
const viewports = [[1440, 900], [1280, 720], [768, 900], [390, 844], [320, 640]];

async function sampleRoleChange(page, role) {
  return page.evaluate(value => new Promise(resolve => {
    const card = document.querySelector('section[aria-label="Acceso al portal"]');
    const frames = [];
    const until = performance.now() + 1000;
    function sample() {
      const { width, height } = card.getBoundingClientRect();
      frames.push({ width, height });
      if (performance.now() < until) requestAnimationFrame(sample);
      else resolve(frames);
    }
    sample();
    card.querySelector(`input[name="accountType"][value="${value}"]`).click();
  }), role);
}

try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    assert.equal(await page.locator("header").getAttribute("aria-hidden"), width < 768 ? "false" : "true");
    assert.equal(await page.locator("header").evaluate(el => el.inert), width >= 768);
    const brand = page.locator("header a").first();
    assert.equal(await brand.evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)");
    assert.equal(await brand.evaluate(el => getComputedStyle(el).borderTopStyle), "none");
    assert.equal(await brand.locator("img").evaluate(el => getComputedStyle(el).filter), "none");
    assert.equal(await brand.locator("img").evaluate(el => el.getBoundingClientRect().height), 48);
    assert.match(await brand.locator("img").getAttribute("src"), /funes-navbar-emblem\.svg/);
    assert.equal(await page.locator("header").evaluate(el => el.getBoundingClientRect().height), 64);
    assert.equal(await brand.getAttribute("href"), "https://funes.gob.ar/");
    const card = page.getByRole("region", { name: "Acceso al portal" });
    if (width < 768) {
      const composition = await card.evaluate(el => {
        const area = el.parentElement.parentElement;
        const hero = area.parentElement;
        const photo = hero.querySelector("canvas[data-ribbons]");
        const a = area.getBoundingClientRect();
        const p = photo.getBoundingClientRect();
        return { heading: getComputedStyle(hero.querySelector("h1").parentElement).display, photoPosition: getComputedStyle(photo).position, background: getComputedStyle(area).backgroundColor, overlap: p.top <= a.top && p.bottom >= a.bottom };
      });
      assert.deepEqual(composition, { heading: "block", photoPosition: "absolute", background: "rgb(7, 74, 31)", overlap: true });
      assert.equal(await page.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal.", exact: true }).isVisible(), true);
    }
    let candidateWidth;
    for (const mode of ["login", "candidate", "company"]) {
      if (mode === "candidate") await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
      if (mode === "company") {
        if (width === 1440) {
          const frames = await sampleRoleChange(page, "company");
          assert.ok(frames.at(-1).width > frames[0].width + 20);
          assert.ok(frames.some(frame => frame.width > frames[0].width + 1 && frame.width < frames.at(-1).width - 1), "Company expansion has intermediate width frames");
        } else await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      }
      await page.waitForTimeout(900);
      assert.equal(await page.getByText("Portal Municipal de Empleo de Funes", { exact: true }).count(), 0);
      if (width < 768) {
        const mobileSpacing = await card.evaluate(el => {
          const action = document.querySelector('a[href="#ofertas-disponibles"]');
          const footer = action.parentElement;
          const f = getComputedStyle(footer);
          const a = action.getBoundingClientRect();
          const box = footer.getBoundingClientRect();

          const introduction = document.querySelector("h1").parentElement;
          const intro = introduction.getBoundingClientRect();
          const area = el.parentElement.parentElement;
          const style = getComputedStyle(area);
          const access = area.getBoundingClientRect();
          const card = el.getBoundingClientRect();
          const offers = document.getElementById("ofertas-disponibles").getBoundingClientRect();
          return { padding: [f.paddingTop, f.paddingBottom], above: a.top - box.top, below: box.bottom - a.bottom, introGap: card.top - intro.bottom, introClearance: introduction.firstElementChild.getBoundingClientRect().top + scrollY, background: style.backgroundColor, shadow: style.boxShadow, cardBackground: getComputedStyle(el).backgroundImage, accessWidth: access.width, cardGutters: [card.left - access.left, access.right - card.right], cardBottomClearance: access.bottom - card.bottom, quadrantTopGap: access.top - intro.bottom, containsFooter: area.contains(footer), sectionGap: offers.top - access.bottom, actionBottomClearance: access.bottom - a.bottom };
        });
        assert.deepEqual(mobileSpacing.padding, ["24px", "24px"]);
        assert.equal(mobileSpacing.background, "rgb(7, 74, 31)", "All mobile access modes retain the desktop green quadrant");
        assert.ok(mobileSpacing.shadow.includes("inset"), "Access retains the shared inner shadow");
        assert.match(mobileSpacing.cardBackground, /linear-gradient\(rgb\(255, 255, 255\)/, "The nested card stays white over the green quadrant");
        assert.equal(mobileSpacing.accessWidth, width, "The green quadrant spans the mobile viewport");
        assert.ok(mobileSpacing.cardGutters.every(gap => gap >= 20), "Green stays visible beside the white card");
        assert.ok(mobileSpacing.cardBottomClearance >= 31, "Green surrounds the complete naturally sized card");
        assert.equal(mobileSpacing.containsFooter, true, "The offers shortcut belongs to the same green access quadrant");
        assert.ok(Math.abs(mobileSpacing.sectionGap) < 1, "Green ends directly against the available-offers section");
        assert.ok(Math.abs(mobileSpacing.quadrantTopGap - 32) < 1, "The mobile green quadrant has a separate 32px top margin");
        assert.ok(Math.abs(mobileSpacing.actionBottomClearance - 24) < 1, "Green continues below the offers shortcut to the section boundary");
        assert.ok(Math.abs(mobileSpacing.introGap - 64) < 1, "Mobile spacing includes the quadrant margin and its existing inner padding");
        assert.equal(mobileSpacing.introClearance, 88, "Introduction clears the 64px top navbar by 24px");
        assert.ok(Math.abs(mobileSpacing.above - 24) < 1 && Math.abs(mobileSpacing.below - 24) < 1);
      } else if (mode !== "login") {
        const spacing = await card.evaluate(el => {
          const group = el.parentElement;
          const area = group.parentElement;
          return { top: parseFloat(getComputedStyle(area).paddingTop), bottom: parseFloat(getComputedStyle(area).paddingBottom), alignment: getComputedStyle(area).alignItems };
        });
        assert.ok(spacing.bottom <= 80, "Registration retains only the offers action clearance below");

        assert.equal(spacing.alignment, "center");
        if (mode === "company") assert.equal(spacing.top, spacing.bottom, "Company has symmetric vertical clearance");
        if (mode === "candidate" || mode === "company") {
          const deviation = await card.evaluate(el => {
            const group = el.parentElement.getBoundingClientRect();
            const area = el.parentElement.parentElement;
            const box = area.getBoundingClientRect();
            const style = getComputedStyle(area);
            return Math.abs(group.top + group.height / 2 - (box.top + parseFloat(style.paddingTop) + (box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / 2));
          });
          assert.ok(deviation < 1, "Both registration cards remain vertically centered");
        }
      }
      const geometry = await card.evaluate(el => {
        const content = el.firstElementChild;
        const cardBox = el.getBoundingClientRect();
        const submit = el.querySelector('button[type="submit"]').getBoundingClientRect();
        return { width: cardBox.width, height: cardBox.height, initialTop: cardBox.top + scrollY, fitsInitialViewport: cardBox.bottom + scrollY <= innerHeight, scrollable: [el, content].some(node => ["auto", "scroll"].includes(getComputedStyle(node).overflowY)), clipped: content.scrollHeight > content.clientHeight + 1, submitInside: submit.bottom <= cardBox.bottom + 1 };
      });
      assert.equal(geometry.scrollable, false, "Neither registration surface creates an internal scroll area");
      assert.equal(geometry.clipped, false, "All form fields fit at natural height");
      assert.equal(geometry.submitInside, true, "Final submit remains inside the full-height card");
      const overlapsAction = await card.evaluate(el => {
        const card = el.getBoundingClientRect();
        const action = document.querySelector('a[href="#ofertas-disponibles"]').getBoundingClientRect();
        return card.left < action.right && card.right > action.left && card.top < action.bottom && card.bottom > action.top;
      });
      assert.equal(overlapsAction, false, "Offers action must not cover the form card");
      if (width >= 768 && mode === "company") {
        const alignment = await card.evaluate(el => {
          const card = el.getBoundingClientRect();
          const quadrant = el.parentElement.parentElement.getBoundingClientRect();
          const action = document.querySelector('a[href="#ofertas-disponibles"]').getBoundingClientRect();
          return { vertical: Math.abs(card.top + card.height / 2 - (quadrant.top + quadrant.height / 2)), actionCenter: action.left + action.width / 2 };
        });
        assert.ok(alignment.vertical < 1, "Company card is centered in the full right quadrant");
        assert.ok(Math.abs(alignment.actionCenter - width / 4) < 1, "Company offers shortcut stays clear in the left quadrant");
      }
      if (width === 1440 && mode === "company") assert.equal(geometry.fitsInitialViewport, true, "Company title and complete card fit the desktop viewport");
      const indicators = await page.locator('form input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])').evaluateAll(inputs => inputs.map(input => {
        const label = input.labels[0];
        const requiredMarker = label.querySelector("[data-required-marker]");
        const marker = Boolean(requiredMarker?.textContent?.includes("*")) || getComputedStyle(label, "::after").content.includes("*");
        return { name: input.name, required: input.required, marker };
      }));
      assert.ok(indicators.every(input => (mode === "login" ? false : input.required) === input.marker), "Only registration required fields show initial asterisks");
      assert.doesNotMatch(await card.innerText(), /\(opcional\)/i);
      if (mode === "login") {
        assert.equal(await card.getByText("Entre 6 y 128 caracteres. No compartas tu contraseña.", { exact: true }).count(), 1);
        assert.equal(await card.getByText("Los campos marcados con * son obligatorios.", { exact: true }).count(), 0);
        const recovery = card.getByRole("link", { name: "Recuperar acceso" });
        assert.equal(await recovery.getAttribute("href"), "/recover");
        assert.equal(await recovery.evaluate(el => el.closest("form") === null), true);
        const separator = await card.getByRole("separator").boundingBox();
        const submit = await card.locator('button[type="submit"]').boundingBox();
        const link = await recovery.boundingBox();
        assert.equal(await recovery.evaluate(el => getComputedStyle(el).borderTopStyle), "none", "Recovery stays a subtle borderless link");
        assert.ok(link.width < submit.width * 0.75, "Recovery does not resemble another full-width primary action");
        assert.equal(separator.height, 1);
        assert.ok(separator.y >= submit.y + submit.height && link.y >= separator.y + separator.height);
        assert.ok(link.height >= 44);
      } else {
        assert.equal(await card.getByRole("link", { name: "Recuperar acceso" }).count(), 0);
        assert.equal(await card.getByRole("separator").count(), 0);
        assert.equal(await card.getByText("Entre 6 y 128 caracteres. No compartas tu contraseña.", { exact: true }).count(), 1);
        const note = await card.getByText("Los campos marcados con * son obligatorios.", { exact: true }).boundingBox();
        const submit = await card.locator('button[type="submit"]').boundingBox();
        const box = await card.boundingBox();
        assert.ok(note.y >= submit.y + submit.height, "Required-field explanation is below the registration form");
        assert.ok(note.y + note.height <= box.y + box.height, "Required-field explanation fits inside the card");
      }
      if (mode !== "login") {
        const roles = page.getByRole("group", { name: "Tipo de cuenta", exact: true });
        assert.equal(await roles.evaluate(el => getComputedStyle(el).borderTopColor), "rgb(134, 141, 152)");
        assert.equal(await roles.evaluate(el => getComputedStyle(el).borderTopWidth), "1px");
        if (width < 1024) {
          const caption = await roles.locator('span[aria-hidden="true"]').first().boundingBox();
          const choices = await Promise.all((await roles.locator("label").all()).map(label => label.boundingBox()));
          assert.ok(choices.every(choice => choice.y >= caption.y + caption.height - 1));
          assert.ok(Math.abs(choices[0].y - choices[1].y) < 1);
          const box = await roles.boundingBox();
          assert.ok(Math.abs(caption.x + caption.width / 2 - (box.x + box.width / 2)) < 1, "Account type caption is centered above both choices on mobile/tablet");
          assert.ok(Math.abs((choices[0].x + choices[1].x + choices[1].width) / 2 - (box.x + box.width / 2)) < 2);
        }
      }
      if (mode === "candidate") candidateWidth = geometry.width;
      if (mode === "company") {
        assert.deepEqual(await page.locator('form input:not([type="hidden"])').evaluateAll(inputs => inputs.map(input => input.name)), [
          "legalName", "responsibleName", "email", "cuit", "activity", "locality", "phone", "password", "confirmation",
        ]);
        for (const [leftName, rightName] of [["responsibleName", "email"], ["cuit", "activity"], ["locality", "phone"]]) {
          const left = await page.locator(`input[name="${leftName}"]`).boundingBox();
          const right = await page.locator(`input[name="${rightName}"]`).boundingBox();
          if (width >= 768) {
            assert.ok(Math.abs(left.y - right.y) < 1, `${leftName} and ${rightName} inputs share a desktop row`);
            assert.ok(left.x + left.width <= right.x);
          } else assert.ok(right.y > left.y + left.height, "Paired row stacks on narrow screens");
        }
        if (width >= 1280) assert.ok(geometry.width > candidateWidth + 20);
        assert.equal(await page.locator('input[name="phone"]').evaluate(el => el.required), false);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      results.push({ viewport: `${width}x${height}`, mode, ...geometry, requiredFields: indicators.filter(input => input.required).length });
    }
    if (width === 1440) {
      const frames = await sampleRoleChange(page, "candidate");
      assert.ok(frames.at(-1).width < frames[0].width - 20);
      assert.ok(frames.some(frame => frame.width < frames[0].width - 1 && frame.width > frames.at(-1).width + 1), "Candidate contraction has intermediate width frames");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await card.evaluate(el => getComputedStyle(el.parentElement).transitionDuration), "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  assert.equal(results.length, viewports.length * 3);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  assert.equal(await page.locator("header").getAttribute("aria-hidden"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector("header")?.getAttribute("aria-hidden") === "false");
  assert.equal(await page.locator("header").evaluate(el => el.inert), false);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => document.querySelector("header")?.getAttribute("aria-hidden") === "true");
  if (process.env.HOME_LAYOUT_REPORT) await writeFile(process.env.HOME_LAYOUT_REPORT, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: "PASS", states: results.length, checks: results }, null, 2));
} finally {
  await browser.close();
}
