import { expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { fixtureId } from "./fixtures/quality";
import fixtures from "../fixtures/acceptance-manifest.json" with { type: "json" };

test.use({ trace: "off", screenshot: "off" });
test("SC-008A: cuatro admins locales, barrera común, cuatro mutaciones y auditorías íntegras", async () => {
  test.setTimeout(300_000);
  assertLocalTargets();
  const resetId = randomUUID();
  const reset = spawnSync(process.execPath, ["tests/fixtures/reset-local.mjs", "--confirm-local-reset", "--acceptance"], {
    encoding: "utf8", timeout: 180_000, maxBuffer: 16 * 1024 * 1024,
  });
  // Capture subprocess output: never include CLI status/auth/browser logs in errors.
  expect(reset.status, "Reset frío de aceptación local debe terminar correctamente").toBe(0);
  runLocalMaintenanceSql("set funes.fixture_context='isolated-local-acceptance';\n" + readFileSync(fixtures.acceptance.concurrentAdmins.preparation, "utf8"));
  const measured = spawnSync(process.execPath, ["tests/quality/demo-performance.mjs", "concurrent-admins", resetId, "dpl_localAcceptance"], {
    env: { ...process.env, APP_ENV: "local" }, encoding: "utf8", timeout: 90_000, maxBuffer: 1024 * 1024,
  });
  expect(measured.status, "Las cuatro acciones deben confirmar éxito visible en hasta cinco segundos cada una").toBe(0);
  const receipt = JSON.parse(measured.stdout) as { dataset: string; acceptanceBenchmark: boolean; pass: boolean;
    concurrentResults: { admin: number; milliseconds: number; startOffset: number; pass: boolean }[] };
  expect(receipt.dataset).toBe("acceptance");
  expect(receipt.acceptanceBenchmark).toBe(true);
  expect(receipt.pass).toBe(true);
  expect(receipt.concurrentResults.map(r => r.admin)).toEqual([1, 2, 3, 4]);
  for (const result of receipt.concurrentResults) {
    expect(result.pass).toBe(true);
    expect(result.milliseconds).toBeLessThanOrEqual(5000);
  }
  const f = fixtures.acceptance.concurrentAdmins;
  const opening = fixtureId("opening", f.openingNumber);
  const preselection = fixtureId("participation", f.preselectionParticipation);
  const contact = fixtureId("participation", f.contactParticipation);
  const outcome = fixtureId("participation", f.outcomeParticipation);
  const integrity = runLocalMaintenanceSql(`select
    (exists(select 1 from public.job_openings where id='${opening}' and status='published' and version=3)
    and exists(select 1 from public.participations where id='${preselection}' and status='preselected' and version=3)
    and exists(select 1 from public.participations where id='${contact}' and status='referred' and version=2)
    and exists(select 1 from public.participations where id='${outcome}' and status='hired' and version=2)
    and exists(select 1 from public.audit_events where entity_id='${opening}' and action='opening_approved' and actor_account_id='${fixtureId("admin", 1)}' and request_id is not null)
    and exists(select 1 from public.audit_events where entity_id='${preselection}' and action='stage_skipped' and actor_account_id='${fixtureId("admin", 2)}' and request_id is not null)
    and exists(select 1 from public.audit_events a join public.contact_events c on c.id=a.entity_id where c.participation_id='${contact}' and a.action='contact_recorded' and a.actor_account_id='${fixtureId("admin", 3)}' and a.request_id is not null)
    and exists(select 1 from public.audit_events where entity_id='${outcome}' and action='outcome_confirmed' and actor_account_id='${fixtureId("admin", 4)}' and request_id is not null))::text;`);
  expect(integrity, "Entidades, versiones, actores individuales y auditorías completas").toBe("true");
});
