import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { protectedActions } from "../fixtures/protected-actions";
import { fixtureId, loginFixture } from "./fixtures/quality";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo base local ficticia"));
type CompiledAction = { exportedName: string; workers: Record<string, unknown> };
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, CompiledAction> };
// Unreferenced exports are removed from the build: they have no HTTP endpoint.
// applyToOfferAction is retained for direct compatibility tests; multipart
// applications now use POST /api/candidate/applications, exercised below.
const notExposed = new Set(["screenDuplicatesAction", "confirmOutcomeAction", "applyToOfferAction"]);
const require = createRequire(import.meta.url);
// Use the exact React protocol bundled with the installed Next.js version.
const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.node") as {
  encodeReply(args: unknown[]): Promise<string | FormData>;
};

function endpoint(action: CompiledAction) {
  return Object.keys(action.workers)[0]!.replace(/^app/, "").replace(/\/\([^/]+\)/g, "").replace(/\/page$/, "")
    .replace("[candidateId]", fixtureId("profile", 400)).replace("[companyId]", fixtureId("business", 1))
    .replace("[openingId]", fixtureId("opening", 1)).replace("[participationId]", fixtureId("participation", 301));
}
async function invoke(request: APIRequestContext, id: string, action: CompiledAction, args: unknown[]) {
  const encoded = await encodeReply(args);
  const body = typeof encoded === "string" ? { data: encoded } : { multipart: encoded };
  return request.post(endpoint(action), { ...body, headers: { "Next-Action": id,
    Origin: "http://127.0.0.1:3000", Accept: "text/x-component" }, maxRedirects: 0 });
}

test("inventario HTTP: cada acción protegida tiene endpoint o exclusión de compilación explícita", () => {
  for (const action of protectedActions) {
    const compiled = Object.values(manifest.node).filter((value) => value.exportedName === action.name);
    expect(compiled.length, action.name).toBe(notExposed.has(action.name) ? 0 : 1);
  }
});

for (const actor of ["anonymous", "candidate", "company", "admin"] as const) {
  for (const suspended of actor === "anonymous" ? [false] : [false, true]) {
    test(`HTTP real: ${actor}/${suspended ? "suspended" : "active"} no puede ejecutar acciones privadas ajenas`, async ({ page }) => {
      test.setTimeout(120000);
      const account = actor === "anonymous" ? null : fixtureId(actor, actor === "admin" ? 4 : actor === "candidate" ? 400 : 40);
      if (actor !== "anonymous") await loginFixture(page, actor, actor === "admin" ? 4 : actor === "candidate" ? 400 : 40);
      if (suspended) runLocalMaintenanceSql(`update public.accounts set status='suspended', suspended_reason='Prueba HTTP ficticia', suspended_at=clock_timestamp(), suspended_by='${fixtureId("admin",1)}' where id='${account}'`);
      const before = runLocalMaintenanceSql("select count(*) from public.audit_events");
      const documentCounts = () => runLocalMaintenanceSql("select jsonb_build_object('cvs',(select count(*) from public.cv_documents),'cases',(select count(*) from public.participations))");
      const documentsBefore = documentCounts();
      try {
        for (const entry of protectedActions) {
          if (!suspended && actor !== "anonymous" && (entry.role === actor || entry.role === "active" || entry.databaseRoleCheck)) continue;
          const compiled = Object.entries(manifest.node).find(([, value]) => value.exportedName === entry.name);
          if (!compiled) { expect(notExposed.has(entry.name)).toBe(true); continue; }
          const response = await invoke(page.request, compiled[0], compiled[1], entry.args());
          const body = await response.text();
          expect(response.status(), entry.name).toBe(200);
          expect(response.headers()["content-type"], entry.name).toContain("text/x-component");
          // Reject missing endpoint, malformed fixture, success, or raw errors.
          expect(body, entry.name).not.toMatch(/Failed to find Server Action|VALIDATION_ERROR|INVALID_INPUT|Revisá los datos ingresados|"success":true|"code":"OK"|"status":"success"|"ok":true|"digest"/);
          expect(body, entry.name).toMatch(/DENIED|AUTH_REQUIRED|No tenés permiso|Iniciá sesión|No se pudo|No pudimos|No encontramos el recurso solicitado o no tenés acceso a él/);
        }
        // Supplying another candidate must never make the active candidate act
        // on their behalf. Only the authenticated person's profile is accepted.
        const application = await page.request.post("/api/candidate/applications", {
          headers: { Origin: "http://127.0.0.1:3000" },
          multipart: { openingId: fixtureId("opening",1), candidateVersion: "1",
            candidateId: fixtureId("profile",2),
            cv: { name: "cv-ficticio.pdf", mimeType: "application/pdf", buffer: readFileSync("tests/fixtures/cv-fictitious.pdf") } },
          maxRedirects: 0,
        });
        const expectedStatuses = actor === "anonymous" ? [401] : suspended ? [401,403] : actor === "candidate" ? [422] : [403];
        expect(expectedStatuses, `${actor}: multipart authorization`).toContain(application.status());
        // The session proxy adds no-cache/must-revalidate/max-age=0 as well.
        expect(application.headers()["cache-control"]?.split(",").map(value => value.trim())).toEqual(expect.arrayContaining(["private", "no-store"]));
        expect(application.headers()["content-type"]).toContain("application/json");
        const result = await application.json();
        expect(result).toMatchObject({ success: false, message: expect.any(String) });
        expect(JSON.stringify(result)).not.toMatch(/Persona ficticia|storage_path|auth_user_id|stack trace|%PDF-/i);
        expect(documentCounts()).toBe(documentsBefore);
        expect(runLocalMaintenanceSql("select count(*) from public.audit_events")).toBe(before);
      } finally {
        if (suspended) runLocalMaintenanceSql(`update public.accounts set status='active', suspended_reason=null, suspended_at=null, suspended_by=null where id='${account}'`);
      }
    });
  }
}
