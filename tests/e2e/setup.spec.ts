import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// El hero de la home anima el h1 con un fade de 420 ms desde opacity 0. Playwright lo
// considera visible desde el primer pintado, pero axe todavía no lo cuenta como título
// visible, así que el barrido tiene que esperar el final de la animación.
async function waitForHeroEntrance(page: Page) {
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect.poll(() => heading.evaluate(element => Number(getComputedStyle(element).opacity))).toBe(1);
}

test("base pública en español sin barreras automáticas detectadas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("El empleo en Funes, con acompañamiento municipal.");
  await expect(page.getByRole("link", { name: "Ir al contenido principal", includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveAttribute("id", "contenido");
  const navigation = page.getByRole("navigation", { name: "Navegación principal", includeHidden: true });
  await expect(navigation.getByRole("link", { name: "Ir al sitio de la Municipalidad de Funes", includeHidden: true })).toHaveAttribute("href", "https://funes.gob.ar/");
  await expect(navigation.getByRole("link", { name: "Ofertas", exact: true, includeHidden: true })).toHaveAttribute("href", "/ofertas");
  await waitForHeroEntrance(page);
  // La navbar de la home está inerte mientras no se desplaza (HomeNavbar: inert={!visible}),
  // así que el primer Tab ya entra al panel de acceso unificado: no hace falta enlace de salto.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const state of ["suspendido", "sesion-vencida", "recuperacion-invalida"]) {
  test(`aviso de acceso en Home sin barreras automáticas: ${state}`, async ({ page }) => {
    await page.goto(`/?acceso=${state}`);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveAttribute("id", "contenido");
    await waitForHeroEntrance(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("enlace de verificación vencido: una sola main, un solo h1 y sin barreras", async ({ page }) => {
  await page.goto("/verification-expired");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Enlace de verificación inválido o vencido");
  await expect(page.getByRole("button", { name: "Reenviar verificación" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const path of ["/", "/?registro=candidato", "/?registro=empresa", "/recover"]) {
  test(`navegación existente sin enlace global en ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "Ir al contenido principal", includeHidden: true })).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveAttribute("id", "contenido");
    await waitForHeroEntrance(page);
    await page.keyboard.press("Tab");
    if (path === "/recover") {
      const focused = page.locator(":focus");
      await expect(focused).toBeVisible();
      await expect(focused).toHaveAttribute("href", "https://funes.gob.ar/");
    } else {
      // En la home (login y registro) la navbar queda inerte mientras está oculta,
      // así que el primer foco cae en el conmutador del panel de acceso unificado.
      const modeSwitch = page.getByRole("button", { name: "Iniciar sesión", exact: true });
      await expect(modeSwitch).toBeFocused();
      await expect(modeSwitch).toHaveAttribute("aria-pressed", path === "/" ? "true" : "false");
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("anonymous navbar consistently returns to the Home access landmark", async ({ page }) => {
  for (const path of ["/ofertas", "/cursos", "/recover", "/terminos", "/verification-expired", "/logout"]) {
    await page.goto(path);
    const navigation = page.getByRole("navigation", { name: "Navegación principal", exact: true });
    await expect(navigation.getByRole("link", { name: "Inicio", exact: true })).toHaveAttribute("href", "/");
    await expect(navigation.getByRole("link", { name: "Ofertas", exact: true })).toHaveAttribute("href", "/ofertas");
    const access = navigation.getByRole("link", { name: "Ingresar", exact: true });
    await expect(access).toHaveAttribute("href", "/#contenido");
    await expect(navigation.getByRole("link", { name: "Mi cuenta", exact: true })).toHaveCount(0);
    await access.focus();
    await access.press("Enter");
    await expect(page).toHaveURL(/\/#contenido$/);
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
  }
});
