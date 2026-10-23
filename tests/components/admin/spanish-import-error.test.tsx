import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { ImportUpload } from "@/features/imports/components/upload";

afterEach(() => vi.unstubAllGlobals());
it("una caída de red muestra un error español sin borrar el CSV o la confirmación", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));
  render(<ImportUpload />);
  const file = new File(["nombre,dni"], "datos-ficticios.csv", { type: "text/csv" });
  const NativeFormData = FormData;
  vi.stubGlobal("FormData", class extends NativeFormData {
    constructor(form?: HTMLFormElement) { super(form); this.set("file", file); }
  });
  const input = screen.getByLabelText("CSV ficticio") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  const confirmation = screen.getByRole("checkbox");
  fireEvent.click(confirmation);
  fireEvent.click(screen.getByRole("button", { name: "Previsualizar" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Revisá la conexión"));
  expect(screen.queryByText(/Failed to fetch/)).toBeNull();
  expect(input.files?.[0]).toBe(file);
  expect(confirmation).toHaveProperty("checked", true);
  expect(screen.getByText("datos-ficticios.csv")).toBeTruthy();
});
