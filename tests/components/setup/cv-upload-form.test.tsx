import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
import { CvUploadForm } from "@/features/candidates/components/cv-upload-form";

beforeEach(() => { vi.clearAllMocks(); });

it("retiene el archivo ante un rechazo del servidor y explica cómo corregirlo", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "invalid" }), { status: 422 }));
  const view = render(<CvUploadForm candidateId="ficticio" version={2} />);
  const input = screen.getByLabelText("Elegir PDF") as HTMLInputElement;
  const file = new File(["PDF ficticio"], "ficticio.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
  fireEvent.submit(view.container.querySelector("form")!);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  expect((await screen.findByRole("alert")).textContent).toContain("El PDF fue rechazado");
  expect(input.files?.[0]).toBe(file);
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(mocks.refresh).not.toHaveBeenCalled();
  expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ Accept: "application/json" });
});

it("muestra un mensaje seguro y conserva la selección si falla la red", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("private details"));
  const view = render(<CvUploadForm candidateId="ficticio" version={2} />);
  const input = screen.getByLabelText("Elegir PDF") as HTMLInputElement;
  const file = new File(["PDF ficticio"], "ficticio.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
  fireEvent.submit(view.container.querySelector("form")!);
  expect((await screen.findByRole("alert")).textContent).toContain("El archivo se conserva");
  expect(screen.getByRole("alert").textContent).not.toContain("private details");
  expect(input.files?.[0]).toBe(file);
});

it("solo anuncia el éxito al recibir la versión nueva del perfil, antes de otras acciones", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
  const view = render(<CvUploadForm candidateId="ficticio" version={2} />);
  const file = new File(["PDF ficticio"], "ficticio.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText("Elegir PDF"), { target: { files: [file] } });
  fireEvent.submit(view.container.querySelector("form")!);
  await screen.findByText("CV guardado; actualizando el perfil…");
  expect(screen.queryByText("CV guardado.", { exact: true })).toBeNull();
  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  expect(mocks.refresh).toHaveBeenCalledOnce();
  view.rerender(<CvUploadForm candidateId="ficticio" version={3} />);
  expect(screen.getByText("CV guardado.", { exact: true })).toBeTruthy();
  expect(screen.getByRole("button")).toHaveProperty("disabled", false);
});
