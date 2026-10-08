import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { assessColdSeries, assessFirstAttempt, assessMeasurement, assessTimedCohort, type Measurement } from "./acceptance";
import manifest from "../fixtures/acceptance-manifest.json";
const example: Measurement = { case: "metricsExport", elapsedMs: 29999, deployment: "https://example.invalid",
  commit: "ficticio", date: "2026-09-27", fixtureHash: manifest.seedSha256, resetId: "ficticio-1",
  browser: "ficticio", device: "ficticio", connection: "ficticia", participantId: "P-01", cold: true, completed: true, expectedDataVerified: true };
describe("T089/T092: validadores del protocolo, NO mediciones de aceptación", () => {
  it("fixture e inputs no cambian sin actualizar manifiesto", () => {
    const seed = readFileSync("supabase/seed.sql", "utf8").replaceAll("\r\n", "\n");
    expect(createHash("sha256").update(seed).digest("hex")).toBe(manifest.seedSha256);
    expect(manifest.counts).toMatchObject({ candidates:4,companies:4,offers:8,participations:8 });
    expect(manifest.sc008a.candidateSearch.expectedTotal).toBe(1);
    expect(manifest.sc008a.openingList).toMatchObject({page:2,pageSize:2,expectedTotal:4});
    expect(manifest.sc008a.companyList).toMatchObject({page:2,pageSize:2,expectedTotal:4});
  });
  it("respeta límites y rechaza evidencia incompleta o calentada", () => {
    expect(assessMeasurement(example,manifest.seedSha256)).toBe(true);
    for (const change of [{elapsedMs:30000},{cold:false},{completed:false},{resetId:""},{fixtureHash:"otro"},{deployment:"http://localhost"}])
      expect(assessMeasurement({...example,...change},manifest.seedSha256)).toBe(false);
    expect(assessMeasurement({...example,case:"cvDownload",elapsedMs:10000},manifest.seedSha256)).toBe(true);
  });
  it("no promedia fallos ni reutiliza reset", () => {
    expect(assessColdSeries([example,{...example,resetId:"2",elapsedMs:30001}],manifest.seedSha256)).toBe(false);
    expect(assessColdSeries([example,example],manifest.seedSha256)).toBe(false);
    expect(assessColdSeries([],manifest.seedSha256)).toBe(false);
  });
  it("exige diez ejecuciones, cinco personas y 9 éxitos sin ayuda", () => {
    const runs=Array.from({length:10},(_,i)=>({participantId:`P-${i%5}`,elapsedMs:1000,completed:true,helped:false}));
    expect(assessTimedCohort(runs)).toBe(true);
    expect(assessTimedCohort(runs.slice(1))).toBe(false);
    expect(assessTimedCohort(runs.map(r=>({...r,participantId:"único"})))).toBe(false);
  });
  it("primer intento es independiente y exige 80% por tarea", () => {
    const runs=Array.from({length:4},(_,i)=>({participantId:`A-${i}`,completed:true,helped:false,restarted:false}));
    expect(assessFirstAttempt(runs,4)).toBe(true);
    expect(assessFirstAttempt([{...runs[0]!,restarted:true},...runs.slice(1)],4)).toBe(false);
  });
});
