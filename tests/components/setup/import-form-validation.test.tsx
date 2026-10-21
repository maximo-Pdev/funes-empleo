import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
vi.mock("@/features/imports/actions", () => ({ resolveImportAction: vi.fn() }));
import { resolveImportAction } from "@/features/imports/actions";
import { ImportBatch } from "@/features/imports/components/preview";
import type { ImportPreview } from "@/features/imports/preview-service";

const preview: ImportPreview = { id: "ficticio", status: "blocked", version: 1, total: 1, valid: 0, invalid: 1, duplicates: 0,
  hash: "ficticio", mapping: "demo-v1", retryOf: null, failure: null,
  rows: [{ id: "fila-ficticia", status: "invalid", number: 1, name: "Persona ficticia", dni: "99123456", email: "", phone: "",
    locality: "Funes", summary: "Ficticio", availability: "available", categories: [], errors: ["INVALID_ROW"], matches: [], fields: [], decision: null }] };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(resolveImportAction).mockResolvedValue({ ok: false, error: "No se pudo guardar." }); });

it("rechazar una fila no exige completar datos de corrección y conserva el motivo ante un fallo", async () => {
  render(<ImportBatch initial={preview} />);
  fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "reject" } });
  fireEvent.change(screen.getByLabelText("Motivo interno"), { target: { value: "Decisión ficticia" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar decisión y revalidar" }));
  await screen.findByRole("alert");
  expect(resolveImportAction).toHaveBeenCalledWith(expect.objectContaining({ decision: "reject", data: null, reason: "Decisión ficticia" }));
  expect(screen.getByLabelText("Motivo interno")).toHaveProperty("value", "Decisión ficticia");
});

it("corregir exige nombre, DNI y un contacto; usar existente exige elegir un perfil", () => {
  render(<ImportBatch initial={preview} />);
  fireEvent.change(screen.getByLabelText("Motivo interno"), { target: { value: "Corrección ficticia" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar decisión y revalidar" }));
  expect(screen.getByLabelText("Nombre", { selector: 'input[name="name"]' }).getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByLabelText("DNI", { selector: 'input[name="dni"]' }).getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByLabelText("Correo", { selector: 'input[name="email"]' }).getAttribute("aria-invalid")).toBe("true");
  expect(resolveImportAction).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "use_or_update_existing" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar decisión y revalidar" }));
  expect(screen.getByLabelText("Perfil coincidente").getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByLabelText("Motivo interno")).toHaveProperty("value", "Corrección ficticia");
  expect(screen.getByLabelText("Nombre", { selector: 'input[name="name"]' }).getAttribute("aria-invalid")).not.toBe("true");
  expect(resolveImportAction).not.toHaveBeenCalled();
});
