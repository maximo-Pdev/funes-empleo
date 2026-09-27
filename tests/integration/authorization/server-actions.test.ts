// Service integration, not HTTP or database evidence: real actions and validators,
// simulated sessions, and a tripwire at every data-access boundary.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/env/server", () => ({ getServerEnvironment: () => ({ APP_ENV: "local", IMPORT_MAPPING_VERSION: "demo-candidates-v1", CONSENT_POLICY_VERSION: "demo-v1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("Unexpected redirect"); }) }));
import { readAccountSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import * as candidateAdmin from "@/features/candidates/admin-actions";
import * as assisted from "@/features/candidates/assisted-actions";
import * as claim from "@/features/candidates/claim-actions";
import * as duplicate from "@/features/candidates/duplicate-actions";
import * as candidateProfile from "@/features/candidates/profile-actions";
import * as consent from "@/features/candidates/consent-actions";
import * as participation from "@/features/participations/candidate-actions";
import * as evaluation from "@/features/participations/evaluation-actions";
import * as nomination from "@/features/participations/nomination-actions";
import * as openingAdmin from "@/features/openings/admin-actions";
import * as openingCompany from "@/features/openings/company-actions";
import * as company from "@/features/companies/company-actions";
import * as companyAdmin from "@/features/companies/admin-actions";
import * as accounts from "@/features/accounts/actions";
import * as imports from "@/features/imports/actions";
import * as feedback from "@/features/referrals/feedback-actions";
const actions = { ...candidateAdmin, ...assisted, ...claim, ...duplicate, ...candidateProfile,
  ...consent, ...participation, ...evaluation, ...nomination, ...openingAdmin, ...openingCompany,
  ...company, ...companyAdmin, ...accounts, ...imports, ...feedback };

const id = "00000000-0000-4000-8000-000000000001";
const profile = { name: "Persona ficticia", dni: "99000001", locality: "Funes", summary: "",
  availability: "available", detail: "", address: "", categories: [], phone: "", email: "fixture@example.invalid", interests: [] };
const common = { version: "1", candidateVersion: "1", expectedVersion: "1", accountVersion: "1",
  id, accountId: id, candidateId: id, openingId: id, participationId: id, referralId: id,
  confirmed: "on", reason: "Prueba ficticia", command: "suspend" };
const state = { success: false, message: "", status: "idle" };
function form(values: Record<string, unknown>) {
  const result = new FormData();
  for (const [key, value] of Object.entries({ ...common, ...values })) {
    for (const item of Array.isArray(value) ? value : [value]) result.append(key, String(item));
  }
  return result;
}
type Role = "candidate" | "company" | "admin";
type Entry = { file: string; name: string; role: Role | "active"; args: () => unknown[]; databaseRoleCheck?: boolean };
const entries: Entry[] = [];
function add(file: string, role: Entry["role"], name: string, input: unknown, asForm = false, databaseRoleCheck = false) {
  entries.push({ file, name, role, args: () => asForm ? [state, form(input as Record<string, unknown>)] : [input], databaseRoleCheck });
}
add("candidates/admin-actions", "admin", "candidateAccountDecisionAction", { resource: "candidate_account", resourceId: id, version: 1, action: "suspend", reason: "Prueba ficticia", confirmed: true });
add("candidates/assisted-actions", "admin", "saveAssistedAction", { candidateId: null, version: null, data: profile, resolution: null });
add("candidates/assisted-actions", "admin", "assistedCommandAction", { candidateId: id, version: 1, command: "activate", confirmed: true });
add("candidates/claim-actions", "admin", "claimAssistedAction", { candidateId: id, accountId: id, version: 1, dni: profile.dni, verifiedInPerson: true });
add("candidates/duplicate-actions", "admin", "screenDuplicatesAction", profile);
for (const name of ["saveProfileAction", "savePhoneAction", "activateProfileAction", "archiveProfileAction"]) add("candidates/profile-actions", "candidate", name, profile, true);
add("candidates/consent-actions", "candidate", "changeConsentAction", { status: "withdrawn" }, true);
for (const name of ["applyToOfferAction", "withdrawParticipationAction"]) add("participations/candidate-actions", "candidate", name, {}, true);
add("participations/evaluation-actions", "admin", "recordEvaluationAction", { participationId: id, version: 1, command: "start_review" });
add("participations/evaluation-actions", "admin", "adminParticipationAction", { participationId: id, version: 1, command: "start_review" });
add("participations/evaluation-actions", "admin", "confirmFeedbackAction", { participationId: id, feedbackId: id, version: 1, outcome: "hired", reason: "", lateCorrection: false });
add("participations/nomination-actions", "admin", "createAdminNominationAction", { candidateId: id, openingId: id, candidateVersion: 1, openingVersion: 1 });
add("openings/admin-actions", "admin", "moderateOpeningAction", { openingId: id, version: 1, decision: "approved" });
add("openings/company-actions", "company", "saveCompanyOpeningAction", { title: "", tasks: "", requirements: "", location: "", modality: "", schedule: "", contractType: "", closingDate: "", salary: "", benefits: "" }, true);
add("openings/company-actions", "company", "submitCompanyOpeningAction", {}, true);
add("companies/company-actions", "company", "saveCompanyProfileAction", { legalName: "Empresa ficticia", cuit: "30999999991", responsibleName: "Contacto ficticio", email: "fixture@example.invalid", phone: "", activity: "Prueba", locality: "Funes" }, true);
add("companies/company-actions", "company", "archiveCompanyAction", {}, true);
// Shared account command permits self-archive. Target/role is checked by the SQL
// command, not an admin-only server guard: active cross-role cases belong to pgTAP.
add("companies/admin-actions", "admin", "adminCompanyAction", {}, true, true);
add("accounts/actions", "active", "accountStatusAction", {}, true, true);
add("accounts/actions", "active", "passwordAction", { password: "Fictitious-Test-Only!", confirmation: "Fictitious-Test-Only!" }, true);
add("imports/actions", "admin", "resolveImportAction", {});
add("referrals/feedback-actions", "company", "submitFeedbackAction", { reportedOutcome: "hired" }, true);
add("referrals/feedback-actions", "company", "submitInterviewAction", { status: "scheduled", scheduledAt: "2026-09-27T10:00" }, true);
add("referrals/feedback-actions", "admin", "confirmOutcomeAction", { outcome: "hired" }, true);

const publicActions = ["accounts/actions:loginAction", "accounts/actions:recoveryAction",
  "accounts/actions:verificationAction", "accounts/actions:registerAccountAction", "accounts/actions:logoutAction",
  "candidates/registration-actions:registerCandidateAction", "companies/company-actions:registerCompanyAction"];
const accessed = vi.fn(() => { throw new Error("Unauthorized data access"); });
beforeEach(() => vi.clearAllMocks());

it("inventario: cada Server Action exportada está clasificada, sin omisiones silenciosas", () => {
  const root = join(process.cwd(), "src/features");
  const found: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith("actions.ts")) continue;
    const path = join(entry.parentPath, entry.name);
    const file = relative(root, path).replaceAll("\\", "/").replace(/\.ts$/, "");
    for (const match of readFileSync(path, "utf8").matchAll(/export async function (\w+)/g)) found.push(`${file}:${match[1]}`);
  }
  expect([...entries.map(e => `${e.file}:${e.name}`), ...publicActions].sort()).toEqual(found.sort());
});

for (const entry of entries) {
  const actors = [{ role: "anonymous", status: "none" }, ...(["candidate", "company", "admin"] as const)
    .flatMap(role => ["active", "suspended", "archived"].map(status => ({ role, status })))];
  for (const actor of actors.filter(a => a.status !== "active" ||
    (!entry.databaseRoleCheck && entry.role !== "active" && a.role !== entry.role))) {
    it(`${entry.file}:${entry.name} rechaza ${actor.role}/${actor.status} antes de datos`, async () => {
      vi.mocked(readAccountSession).mockResolvedValue(actor.role === "anonymous" ? null : {
        account: { id, role: actor.role, status: actor.status },
        client: { rpc: accessed, from: accessed, storage: { from: accessed }, auth: { updateUser: accessed } },
      } as never);
      let result: unknown;
      const action = actions[entry.name as keyof typeof actions] as (...args: unknown[]) => Promise<unknown>;
      try { result = await action(...entry.args()); }
      catch (error) { result = error; }
      // Guards must actually run: malformed fixture input must not pass as denial.
      expect(readAccountSession).toHaveBeenCalled();
      expect(accessed).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
      const value = result as { code?: string; success?: boolean; status?: string; message?: string };
      expect(value.success).not.toBe(true);
      expect(value.status).not.toBe("success");
      expect(value.code).not.toBe("OK");
      expect(value.code).not.toBe("INVALID_INPUT");
      expect(value.code).not.toBe("VALIDATION_ERROR");
      expect(value.message ?? "").not.toContain("Revisá los datos ingresados");
    });
  }
}
