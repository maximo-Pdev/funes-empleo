import { existsSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

const templatePath = "supabase/templates/invite.html";

it("enables the reviewed invite-only email template", () => {
  const config = readFileSync("supabase/config.toml", "utf8");
  const invite = config.match(/^\[auth\.email\.template\.invite\]\s*\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m)?.[1];
  expect(invite).toBeDefined();
  expect(invite).toContain(`content_path = "./${templatePath}"`);
  expect(existsSync(templatePath)).toBe(true);
});

it("sends the one-time hash directly to the canonical server callback", () => {
  const template = existsSync(templatePath) ? readFileSync(templatePath, "utf8") : "";
  const href = template.match(/href="([^"]+)"/)?.[1] ?? "";
  const rendered = href.replaceAll("&amp;", "&")
    .replace("{{ .SiteURL }}", "https://portal.example.invalid")
    .replace("{{ .TokenHash }}", "fictitious-invite-hash");
  expect(rendered).toBe("https://portal.example.invalid/auth/callback?token_hash=fictitious-invite-hash&type=invite&next=/update-password");
  expect(template).not.toMatch(/ConfirmationURL|RedirectTo|access_token|refresh_token|<script|<img/i);
});
