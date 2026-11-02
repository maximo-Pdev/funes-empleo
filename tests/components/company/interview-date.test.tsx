import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("@/features/referrals/feedback-actions", () => ({ submitFeedbackAction: vi.fn(), submitInterviewAction: vi.fn() }));
import { InterviewForm } from "@/features/referrals/components/referral-forms";

it("requiere solo fecha programada, conserva errores/datos y no envía fecha realizada", () => {
  const { container } = render(<InterviewForm openingId="offer" referralId="referral" version={3} />);
  const scheduled = screen.getByLabelText("Fecha programada (Funes)");
  const message = screen.getByLabelText("Observación para la Oficina (opcional)");
  expect(scheduled).toHaveProperty("required", true);
  expect(screen.queryByLabelText("Fecha realizada (Funes)")).toBeNull();
  fireEvent.change(message, { target: { value: "Observación ficticia a conservar" } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar entrevista" }));
  expect(scheduled.getAttribute("aria-invalid")).toBe("true");
  expect(scheduled).toBe(document.activeElement);
  expect(message).toHaveProperty("value", "Observación ficticia a conservar");
  fireEvent.change(scheduled, { target: { value: "2026-11-03T10:00" } });
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "completed" } });
  const form = container.querySelector("form")!;
  expect(form.checkValidity()).toBe(true);
  const data = new FormData(form);
  expect(data.get("scheduledAt")).toBe("2026-11-03T10:00");
  expect(data.get("status")).toBe("completed");
  expect(data.get("expectedVersion")).toBe("3");
  expect(data.has("heldAt")).toBe(false);
});
