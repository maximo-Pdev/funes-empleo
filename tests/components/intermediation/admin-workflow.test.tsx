import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
import { ModerationForm } from "@/features/openings/components/moderation-form";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
import { ParticipationActionForm } from "@/features/participations/components/participation-action-form";
import { SafetyDecisionForm } from "@/features/participations/components/safety-decision-form";
import { ParticipationTimeline } from "@/features/participations/components/participation-timeline";
import { FeedbackReviewPanel } from "@/features/participations/components/feedback-review-panel";

describe("intermediación administrativa", () => {
  it("exige una explicación empresarial para corrección y separa el motivo interno", () => {
    const submit = vi.fn();
    render(<ModerationForm openingId="offer-1" version={2} status="pending_review" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "changes_requested" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/explicación.*empresa/i);
    fireEvent.change(screen.getByRole("textbox", { name: /^Explicación para la empresa/ }), { target: { value: "Completá el horario." } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      openingId: "offer-1", version: 2, decision: "changes_requested", publicMessage: "Completá el horario.",
    }));
  });

  it("filtra candidatos por categoría, disponibilidad, localidad y vigencia con controles etiquetados", () => {
    const search = vi.fn();
    render(<CandidateSearchForm categories={[{ id: "cat-1", name: "Categoría ficticia" }]} onSearch={search} />);
    fireEvent.change(screen.getByLabelText("Término"), { target: { value: "Persona ficticia" } });
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "cat-1" } });
    fireEvent.change(screen.getByLabelText("Disponibilidad"), { target: { value: "available" } });
    fireEvent.change(screen.getByLabelText("Localidad"), { target: { value: "Funes" } });
    fireEvent.change(screen.getByLabelText("Vigencia"), { target: { value: "current" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar candidatos" }));
    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      term: "Persona ficticia", categoryId: "cat-1", availability: "available", locality: "Funes", vigency: "current",
    }));
  });

  it("no permite omitir una etapa sin motivo ni convierte la derivación en un salto implícito", () => {
    const submit = vi.fn();
    render(<ParticipationActionForm participationId="case-1" version={4} status="under_review" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Acción"), { target: { value: "skip_to_preselected" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/motivo/i);
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
    expect(screen.getByRole("alert").textContent).toMatch(/motivo/i);
    fireEvent.change(screen.getByRole("textbox", { name: /^Motivo interno/ }), { target: { value: "Evaluación municipal suficiente" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ command: "refer", reason: "Evaluación municipal suficiente" }));
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
    expect(screen.getByRole("alert").textContent).toMatch(/motivo/i);
    fireEvent.change(screen.getByRole("textbox", { name: /^Motivo interno/ }), { target: { value: "Se inició con entrevista" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(screen.getByRole("alert").textContent).toMatch(/canal/i);
    fireEvent.change(screen.getByLabelText("Canal de preentrevista"), { target: { value: "phone" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Resumen interno" }), { target: { value: "Llamada ficticia" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ command: "record_preinterview", channel: "phone", summary: "Llamada ficticia" }));
  });

  it("muestra un conflicto de versión sin filtrar detalles del servidor", async () => {
    const submit = vi.fn().mockResolvedValue({ code: "CONFLICT_STALE_DATA" });
    render(<ModerationForm openingId="offer-2" version={1} status="pending_review" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "approved" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/registro cambió/i));
    expect(screen.getByRole("alert").textContent).not.toMatch(/CONFLICT_STALE_DATA/);
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
