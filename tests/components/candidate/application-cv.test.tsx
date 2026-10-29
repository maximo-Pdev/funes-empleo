import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/participations/candidate-actions", () => ({ withdrawParticipationAction: vi.fn() }));
import { CandidateApplyForm } from "@/features/participations/components/candidate-status";
beforeEach(() => vi.clearAllMocks());
it("shows general fallback and an optional PDF/JPEG/PNG field, excluding WebP", () => {
  render(<CandidateApplyForm openingId="fictitious" candidateVersion={1} disabled={false} generalCvName="general.pdf" />);
  expect(screen.getByText(/se usará tu CV del perfil: general.pdf/)).toBeTruthy();
  const input = screen.getByLabelText("CV específico para esta oferta (opcional)") as HTMLInputElement;
  expect(input.required).toBe(false); expect(input.accept).toContain("image/png"); expect(input.accept).not.toContain("webp");
  expect(input.getAttribute("data-max-bytes")).toBe(String(5 * 1024 * 1024));
});
it("keeps the selected file and shows field feedback after server rejection", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: false, field: "cv", message: "Archivo inválido. Elegí otro CV." }), { status: 422 }));
  const view = render(<CandidateApplyForm openingId="fictitious" candidateVersion={1} disabled={false} />);
  const input = screen.getByLabelText("CV específico para esta oferta (opcional)") as HTMLInputElement;
  const file = new File(["invalid"], "cv.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } }); fireEvent.submit(view.container.querySelector("form")!);
  expect((await screen.findByRole("alert")).textContent).toContain("Archivo inválido");
  expect(input.files?.[0]).toBe(file); expect(input.getAttribute("aria-invalid")).toBe("true"); expect(mocks.refresh).not.toHaveBeenCalled();
});
it("hides upload and prevents duplicate submission after confirmed success", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const view = render(<CandidateApplyForm openingId="fictitious" candidateVersion={1} disabled={false} />);
  fireEvent.submit(view.container.querySelector("form")!);
  await screen.findByText("Postulación recibida por la Oficina de Empleo.");
  expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
  expect(screen.queryByLabelText("CV específico para esta oferta (opcional)")).toBeNull(); await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
});
