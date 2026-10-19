import { expect, type Page } from "@playwright/test";

/** Assert the unavailable-page contract without depending on streaming status. */
export async function expectUnavailablePublicOffer(page: Page, offerTitle: string) {
  await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(offerTitle);
  await expect(page.getByRole("link", { name: "Postularme con mi cuenta", exact: true })).toHaveCount(0);
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
}