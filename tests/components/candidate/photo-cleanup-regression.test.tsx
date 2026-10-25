import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CandidatePhotoForm } from "@/features/candidates/components/candidate-photo-form";
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
beforeEach(() => refresh.mockClear());
afterEach(() => vi.unstubAllGlobals());
it("retries replacement cleanup without removing the new current photo", async () => {
  const request = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ status: "cleanup_pending", message: "El borrado anterior está pendiente." }) });
  vi.stubGlobal("fetch", request);
  const props = { candidateId: "0504dca9-5ba2-37ba-9fbc-49c71970ad22", version: 1, name: "Persona ficticia" };
  const { rerender } = render(<CandidatePhotoForm {...props} photo={{ id: "old" }} />);
  fireEvent.change(screen.getByLabelText("Elegir foto de perfil"), { target: { files: [new File(["fictitious bytes"], "photo.png", { type: "image/png" })] } });
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  rerender(<CandidatePhotoForm {...props} version={2} photo={{ id: "new-current" }} cleanupPending />);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar eliminación" }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  expect(request.mock.calls[1]![1].body.get("command")).toBe("cleanup");
});
it("explains durable pending cleanup on a fresh page without a current photo", () => {
  render(<CandidatePhotoForm candidateId="candidate" version={3} name="Persona ficticia" photo={null} cleanupPending />);
  expect(screen.getByRole("status").textContent).toContain("pendiente");
  expect(screen.getByRole("button", { name: "Reintentar eliminación" })).toHaveProperty("disabled", false);
});
