import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("@/features/referrals/feedback-actions", () => ({ submitFeedbackAction: vi.fn(), submitInterviewAction: vi.fn() }));
import { FeedbackForm } from "@/features/referrals/components/referral-forms";
it("requires a non-hire reason while keeping hire details optional", () => {
  const { container } = render(<FeedbackForm openingId="opening" referralId="referral" />);
  const outcome = screen.getByLabelText("Resultado informado");
  const message = container.querySelector<HTMLTextAreaElement>('[name="message"]')!;
  fireEvent.change(outcome, { target: { value: "not_selected" } });
  expect(message.required).toBe(true);
  expect(screen.getByLabelText("Motivo de no selección")).toBe(message);
  expect(container.querySelector("form")!.checkValidity()).toBe(false);
  fireEvent.change(message, { target: { value: "Experiencia requerida no acreditada." } });
  expect(container.querySelector("form")!.checkValidity()).toBe(true);
  fireEvent.change(outcome, { target: { value: "hired" } });
  expect(message.required).toBe(false);
  expect(screen.getByLabelText("Detalle breve (opcional)")).toBe(message);
});
