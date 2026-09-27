// Source-contract checks supplement pgTAP; they do not replace runtime evidence.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const matrix = [
  ["accounts", "001_foundation_rls.test.sql"], ["consent", "020_candidate_rls.test.sql"],
  ["cv", "020_candidate_rls.test.sql"], ["duplicate", "040_assisted_candidate.test.sql"],
  ["moderation", "010_intermediation_rls.test.sql"], ["referral", "010_intermediation_rls.test.sql"],
  ["outcomes", "010_intermediation_rls.test.sql"], ["archive", "030_company_rls.test.sql"],
  ["import", "050_import_atomicity.test.sql"], ["metrics", "060_metrics.test.sql"],
  ["integrity", "070_audit_integrity.test.sql"],
] as const;
describe("T093: inventario ejecutable de evidencia de auditoría", () => {
  it.each(matrix)("%s tiene suite transaccional con aserciones", (_name, file) => {
    const sql = readFileSync(join("supabase/tests", file), "utf8");
    expect(sql).toMatch(/begin;/i);
    expect(sql).toMatch(/rollback;/i);
    expect(sql).toMatch(/select (ok|is|throws_ok|lives_ok)\(/);
    expect(sql).toMatch(/audit|histori|evento/i);
  });
  it("el cliente secreto no se exporta ni cruza al navegador", () => {
    const secret = readFileSync("src/lib/supabase/admin.ts", "utf8");
    expect(secret).toContain('import "server-only"');
    expect(secret.match(/export (?:async )?function (\w+)/g)).toEqual(["export async function inviteIndividualAdministrator"]);
    const clientFiles = readdirSync("src", {recursive:true,withFileTypes:true}).filter(f=>f.isFile() && /\.tsx?$/.test(f.name));
    for (const file of clientFiles) {
      const source = readFileSync(join(file.parentPath,file.name),"utf8");
      if (/^["']use client["']/m.test(source)) {
        expect(source).not.toMatch(/SUPABASE_SECRET_KEY|supabase\/admin|createSignedUrl/);
      }
    }
  });
});
