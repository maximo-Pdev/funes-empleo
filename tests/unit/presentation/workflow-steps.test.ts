import { expect, it } from "vitest";
import { candidateWorkflow, adminWorkflow, companyOpeningWorkflow } from "@/domain/presentation/workflow-steps";

it("projects only reception and final result for candidates", () => {
  expect(candidateWorkflow("received").map(step => step.label)).toEqual(["Postulación", "Recibida por la Oficina", "Resultado"]);
  expect(candidateWorkflow("received").map(step => step.state)).toEqual(["completed", "current", "pending"]);
  expect(candidateWorkflow("hired").map(step => step.state)).toEqual(["completed", "completed", "current"]);
});
it("guides direct referral without inventing completion of optional interviews", () => {
  const workflow = adminWorkflow("under_review", false);
  expect(workflow.steps.map(step => step.label)).toEqual(["Recepción", "Evaluación municipal", "Derivación", "Respuesta empresarial", "Resultado confirmado"]);
  expect(workflow.description).toContain("opcional");
  expect(workflow.description).toContain("directamente");
  expect(workflow.target).toBe("#case-actions");
});
it("prioritizes pending feedback while preserving evidenced late correction", () => {
  expect(adminWorkflow("awaiting_feedback", true).target).toBe("#feedback-review");
  expect(adminWorkflow("no_company_response", false).description).toContain("evidencia");
  expect(adminWorkflow("no_company_response", false).target).toBe("#case-actions");
});
it.each(["hired", "not_selected", "withdrawn", "cancelled"] as const)("does not offer new actions for terminal %s", status => {
  expect(adminWorkflow(status, false).target).toBeNull();
  expect(adminWorkflow(status, true).target).toBeNull();
  expect(adminWorkflow(status, false).steps[2]!.state).toBe("pending");
});
it("does not infer publication from cancelled or rejected openings", () => {
  expect(companyOpeningWorkflow("draft").target).toBe("#offer-management");
  expect(companyOpeningWorkflow("published").target).toBe("#derivaciones");
  expect(companyOpeningWorkflow("cancelled").steps[2]!.state).toBe("pending");
  expect(companyOpeningWorkflow("rejected").target).toBeNull();
});
