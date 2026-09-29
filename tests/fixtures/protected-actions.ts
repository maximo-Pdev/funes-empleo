// Valid inputs shared by real HTTP denial tests. No mocked session or client.
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
export const protectedActions: Entry[] = [];
function add(file: string, role: Entry["role"], name: string, input: unknown, asForm = false, databaseRoleCheck = false) {
  protectedActions.push({ file, name, role, args: () => asForm ? [state, form(input as Record<string, unknown>)] : [input], databaseRoleCheck });
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
