import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import { OpeningCandidateMatchesList } from "@/features/participations/components/opening-candidate-matches-list";
import { openingPreview } from "../../fixtures/opening-preview";
const nomination = vi.hoisted(() => ({ preview: vi.fn(), create: vi.fn() }));
vi.mock("@/features/candidates/matching-actions", () => ({ openingCandidatePreviewAction: nomination.preview }));
vi.mock("@/features/participations/nomination-actions", () => ({ createAdminNominationAction: nomination.create }));
import { ModerationForm } from "@/features/openings/components/moderation-form";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
import { ParticipationActionForm } from "@/features/participations/components/participation-action-form";
import { SafetyDecisionForm } from "@/features/participations/components/safety-decision-form";
import { ParticipationTimeline } from "@/features/participations/components/participation-timeline";
import { FeedbackReviewPanel } from "@/features/participations/components/feedback-review-panel";

describe("intermediación administrativa", () => {
  it("continues nomination to the actual case through an opaque action reference", async () => {
    nomination.preview.mockResolvedValue({ code: "OK", profile: { ...openingPreview, cvReference: "cv-111111111111111111111111" } });
    nomination.create.mockResolvedValue({ code: "OK", participationId: openingPreview.id, participationReference: "cas-111111111111111111111111" });
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function(this: HTMLDialogElement) { this.removeAttribute("open"); } });
    render(<OpeningCandidateMatchesList openingId={openingPreview.id} openingReference="ofe-111111111111111111111111" matches={{ available: true, total: 1, page: 1, pageSize: 12, items: [{ id: openingPreview.id, displayName: "Persona ficticia", locality: "Funes", participationId: null, matchedCategories: [] }] }} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nominar a esta oferta" }));
    const next = await screen.findByRole("link", { name: "Continuar evaluación y derivación" });
    expect(next.getAttribute("href")).toBe("/admin/participations/cas-111111111111111111111111");
    expect(next.getAttribute("href")).not.toContain(openingPreview.id);
    expect(screen.getByRole("status").textContent).toContain("todavía no recibe");
  });
  it("exige una explicación empresarial para corrección y separa el motivo interno", () => {
    const submit = vi.fn();
    render(<ModerationForm openingId="offer-1" version={2} status="pending_review" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "changes_requested" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /^Explicación para la empresa/ }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Completá este campo.")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: /^Explicación para la empresa/ }), { target: { value: "Completá el horario." } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      openingId: "offer-1", version: 2, decision: "changes_requested", publicMessage: "Completá el horario.",
    }));
  });

  it("filtra candidatos por palabra y disponibilidad con controles etiquetados", () => {
    render(<CandidateSearchForm categories={[]} />);
    fireEvent.change(screen.getByLabelText("Búsqueda por palabra"), { target: { value: "Persona ficticia" } });
    fireEvent.change(screen.getByLabelText("Disponibilidad"), { target: { value: "available" } });
    const form = screen.getByRole("search") as HTMLFormElement;
    const data = new FormData(form);
    expect(form.method).toBe("get");
    expect(data.get("term")).toBe("Persona ficticia");
    expect(data.getAll("categoryId")).toEqual([]);
    expect(data.get("availability")).toBe("available");
    expect(form.querySelector('[name="locality"]')).toHaveProperty("required", false);
  });

  it("no permite omitir una etapa sin motivo ni convierte la derivación en un salto implícito", () => {
    const submit = vi.fn();
    render(<ParticipationActionForm participationId="case-1" version={4} status="under_review" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Acción"), { target: { value: "skip_to_preselected" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /^Motivo interno/ }).getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(screen.getByRole("textbox", { name: /^Motivo interno/ }), { target: { value: "Evaluación documentada." } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      participationId: "case-1", command: "skip_to_preselected", reason: "Evaluación documentada.",
    }));
    expect(screen.getByText(/derivación requiere una decisión explícita/i)).toBeTruthy();
  });

  it("exige motivo si una derivación directa omite etapas", () => {
    const submit = vi.fn();
    render(<ParticipationActionForm participationId="case-4" version={1} status="received" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Acción"), { target: { value: "refer" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /^Motivo interno/ }).getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(screen.getByRole("textbox", { name: /^Motivo interno/ }), { target: { value: "Evaluación municipal suficiente" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ command: "refer", reason: "Evaluación municipal suficiente" }));
  });

  it("bloquea retiro sin solicitud, señala el selector y conserva el motivo hasta elegir contacto entrante", async () => {
    const submit = vi.fn().mockResolvedValue({ code: "OK" });
    render(<ParticipationActionForm participationId="case-withdrawal" version={4} status="referred"
      contacts={[
        { id: "contact-inbound", label: "Pedido ficticio de retiro", direction: "inbound" },
        { id: "contact-outbound", label: "Llamada saliente ficticia", direction: "outbound" },
      ]} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Acción"), { target: { value: "withdraw_on_request" } });
    const reason = screen.getByRole("textbox", { name: /^Motivo interno/ });
    fireEvent.change(reason, { target: { value: "Pedido de retiro ficticio." } });
    const request = screen.getByLabelText("Solicitud del candidato");
    expect(request).toHaveProperty("required", true);
    expect(screen.queryByRole("option", { name: "Llamada saliente ficticia" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).not.toHaveBeenCalled();
    expect(request.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(request);
    const errorId = request.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)?.textContent).toBe("Elegí una opción.");
    expect(reason).toHaveProperty("value", "Pedido de retiro ficticio.");
    fireEvent.change(request, { target: { value: "contact-inbound" } });
    expect(request.getAttribute("aria-invalid")).not.toBe("true");
    expect(screen.queryByText("Elegí una opción.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      participationId: "case-withdrawal", version: 4, command: "withdraw_on_request",
      reason: "Pedido de retiro ficticio.", contactId: "contact-inbound", candidateRequestId: "contact-inbound",
    }));
  });

  it("destaca la suspensión y exige confirmación expresa; restaurar no promete reactivar casos", () => {
    const submit = vi.fn();
    const { rerender } = render(<SafetyDecisionForm resource="candidate_account" resourceId="account-1" version={1} action="suspend" onSubmit={submit} />);
    fireEvent.change(screen.getByRole("textbox", { name: /^Motivo interno/ }), { target: { value: "Uso indebido" } });
    fireEvent.click(screen.getByRole("button", { name: "Suspender cuenta" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Confirmo la suspensión"));
    fireEvent.click(screen.getByRole("button", { name: "Suspender cuenta" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ confirmed: true, reason: "Uso indebido" }));
    rerender(<SafetyDecisionForm resource="candidate_profile" resourceId="profile-1" version={1} action="restore" onSubmit={submit} />);
    expect(screen.getByText(/borrador.*no reactiva.*participaciones/i)).toBeTruthy();
    rerender(<SafetyDecisionForm resource="candidate_account" resourceId="account-1" version={2} action="reactivate" onSubmit={submit} />);
    expect(screen.getByText(/conserva su estado anterior/i)).toBeTruthy();
    expect(screen.getByText(/no repone participaciones/i)).toBeTruthy();
  });

  it("muestra el resultado vigente sin borrar el cierre automático anterior", () => {
    render(<ParticipationTimeline currentStatus="hired" events={[
      { id: "event-1", occurredAt: "2026-09-01T12:00:00Z", action: "no_company_response", actorLabel: "Sistema", previousStatus: "awaiting_feedback", newStatus: "no_company_response" },
      { id: "event-2", occurredAt: "2026-09-03T12:00:00Z", action: "late_correction", actorLabel: "Administrador ficticio", previousStatus: "no_company_response", newStatus: "hired" },
    ]} />);
    expect(screen.getAllByRole("status")[0]!.textContent).toMatch(/contratad/i);
    expect(screen.getByText(/sin respuesta empresarial.*reemplazado/i)).toBeTruthy();
    expect(screen.getByText(/Administrador ficticio/)).toBeTruthy();
  });

  it("mantiene el feedback empresarial pendiente hasta una confirmación administrativa", () => {
    const confirm = vi.fn();
    render(<FeedbackReviewPanel participationId="case-1" version={3} currentStatus="awaiting_feedback"
      feedback={[{ id: "feedback-1", reportedOutcome: "hired", reportedAt: "2026-09-20T12:00:00Z", reviewStatus: "pending_admin", message: "Resultado ficticio" }]}
      onConfirm={confirm} />);
    expect(screen.getByText(/pendiente de confirmación/i)).toBeTruthy();
    expect(screen.getByText(/esperando respuesta/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar resultado" }));
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ feedbackId: "feedback-1", outcome: "hired" }));
  });

  it("registra la preentrevista con canal y resumen sin exponerla a la empresa", () => {
    const submit = vi.fn();
    render(<ParticipationActionForm participationId="case-2" version={2} status="received" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Acción"), { target: { value: "record_preinterview" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /^Motivo interno/ }).getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(screen.getByRole("textbox", { name: /^Motivo interno/ }), { target: { value: "Se inició con entrevista" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(screen.getByLabelText("Canal de preentrevista").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("textbox", { name: "Resumen interno" }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Fecha realizada").getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(screen.getByLabelText("Canal de preentrevista"), { target: { value: "phone" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Resumen interno" }), { target: { value: "Llamada ficticia" } });
    fireEvent.change(screen.getByLabelText("Fecha realizada"), { target: { value: "2026-09-23T15:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ command: "record_preinterview", channel: "phone", summary: "Llamada ficticia" }));
  });

  it("muestra un conflicto de versión sin filtrar detalles del servidor", async () => {
    router.refresh.mockClear();
    const submit = vi.fn().mockResolvedValue({ code: "CONFLICT_STALE_DATA" });
    render(<ModerationForm openingId="offer-2" version={1} status="pending_review" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "changes_requested" } });
    fireEvent.change(screen.getByRole("textbox", { name: /^Explicación para la empresa/ }), { target: { value: "Texto ficticio a conservar" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/registro cambió/i));
    expect(screen.getByRole("alert").textContent).not.toMatch(/CONFLICT_STALE_DATA/);
    expect(screen.getByRole("textbox", { name: /^Explicación para la empresa/ })).toHaveProperty("value", "Texto ficticio a conservar");
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("sanitiza un error inesperado al confirmar feedback", async () => {
    const confirm = vi.fn().mockRejectedValue(new Error("database private table details"));
    render(<FeedbackReviewPanel participationId="case-3" version={1} currentStatus="awaiting_feedback"
      feedback={[{ id: "feedback-2", reportedOutcome: "not_selected", reportedAt: "2026-09-20T12:00:00Z", reviewStatus: "pending_admin", message: null }]}
      onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar resultado" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/no se pudo guardar/i));
    expect(screen.getByRole("alert").textContent).not.toMatch(/database private table details/);
  });
});
