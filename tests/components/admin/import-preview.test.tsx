import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImportBatch } from "@/features/imports/components/preview";
import type { ImportPreview } from "@/features/imports/preview-service";
vi.mock("@/features/imports/actions", () => ({ resolveImportAction: vi.fn() }));
const initial: ImportPreview = { id: "ee500000-0000-4000-8000-000000000001", version: 2,
  hash: "a".repeat(64), mapping: "demo-candidates-v1", status: "blocked", total: 1, valid: 0,
  invalid: 1, duplicates: 0, failure: null, retryOf: null, rows: [{ id: "ee500000-0000-4000-8000-000000000002", number: 1,
    status: "invalid", errors: ["INVALID_ROW"], decision: null, name: "Persona ficticia", dni: "***001", email: "***@***",
    phone: "", matches: [], fields: [], locality: "Funes", summary: "Prueba", categories: [], availability: "available" }] };
describe("revisión de importación", () => {
  it("impide confirmar inválidos y muestra error accionable sin DNI completo", () => {
    render(<ImportBatch initial={initial} />);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Confirmar importación" }).disabled).toBe(true);
    expect(screen.getByText(/Revisá nombre/)).toBeTruthy();
    expect(screen.getByText(/DNI \*\*\*001/)).toBeTruthy();
  });
  it("fallido ofrece nuevo intento y no confirmación", () => {
    render(<ImportBatch initial={{ ...initial, status: "failed", failure: "IMPORT_FAILED" }} />);
    expect(screen.queryByRole("button", { name: "Confirmar importación" })).toBeNull();
    expect(screen.getByRole<HTMLAnchorElement>("link", { name: /Cargar archivo corregido/ }).href).toContain(`retry=${initial.id}`);
  });
  it("error de confirmación es visible y exige recargar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "El lote cambió." }) }));
    render(<ImportBatch initial={{ ...initial, status: "preview_ready", valid: 1, invalid: 0 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importación" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Recargá"));
    vi.unstubAllGlobals();
  });
});
