import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const company = readFileSync(new URL("../../e2e/company-offer-management.spec.ts", import.meta.url), "utf8");
const session = readFileSync(new URL("../../e2e/session-navigation.spec.ts", import.meta.url), "utf8");

test("company cancellation creates a referral with a current, unexpired feedback window", () => {
  const referral = company.slice(company.indexOf("insert into public.referrals"), company.indexOf("insert into public.opening_moderation_events"));
  const schema = readFileSync(new URL("../../../supabase/migrations/202609190002_business_entities.sql", import.meta.url), "utf8");
  assert.match(schema, /check\(feedback_due_at=referred_at\+interval '720 hours'\)/);
  assert.match(referral, /'referred_at',\s*scenario\.referred_at/);
  assert.match(referral, /'feedback_due_at',\s*scenario\.referred_at\s*\+\s*interval '720 hours'/);
  assert.match(referral, /cross join \(select clock_timestamp\(\) as referred_at\) scenario/);
  const beforeCancellation = company.indexOf('getByLabel("Motivo de la cancelación")');
  assert.ok(beforeCancellation > 0);
  assert.match(company.slice(0, beforeCancellation), /select status from public\.participations where id='\$\{part\}';`\)\)\.toBe\("referred"\)/);
  assert.match(company, /select status from public\.participations where id='\$\{part\}';`\)\)\.toBe\("cancelled"\)/);
});

test("forced refresh starts in a new context only after disposing the login context", () => {
  const body = session.slice(session.indexOf("await loginFixture("));
  const capture = body.indexOf("await loginPage.context().storageState()");
  const dispose = body.indexOf("await loginPage.context().close()");
  const create = body.indexOf("await browser.newContext({", dispose);
  const expire = body.indexOf("await expireStoredSession(page.context())", create);
  assert.ok(capture >= 0 && dispose > capture && create > dispose && expire > create);
  assert.match(body.slice(create, expire), /storageState/);
  assert.match(body, /finally\s*\{\s*await isolatedContext\.close\(\);\s*\}/);
  assert.match(body, /expect\(refreshed\.expiresAt > Math\.floor\(Date\.now\(\) \/ 1000\)\)\.toBe\(true\)/);
});
