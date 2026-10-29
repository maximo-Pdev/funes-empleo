import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
import { ContactRecordForm } from "@/features/participations/components/contact-record-form";

it("conserva el selector nativo y payload ISO con idioma español declarado", async () => {
  const submit = vi.fn().mockResolvedValue({ code: "OK" });
  render(<ContactRecordForm participationId="fictitious" version={3} onSubmit={submit} />);
  const date = screen.getByLabelText("Fecha y hora (Funes)");
  expect(date.getAttribute("type")).toBe("datetime-local");
  expect(date.getAttribute("lang")).toBe("es-AR");
  expect(date.getAttribute("placeholder")).toBeNull();
  fireEvent.change(date, { target: { value: "2026-11-05T14:30" } });
  fireEvent.change(screen.getByLabelText("Resumen interno"), { target: { value: "Contacto ficticio." } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contacto" }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ command: "record_contact", participationId: "fictitious", version: 3,
    channel: "phone", direction: "inbound", occurredAtLocal: "2026-11-05T14:30", summary: "Contacto ficticio." }));
});
it("enfoca la fecha requerida sin perder resumen y permite completarla", async () => {
  const submit = vi.fn().mockResolvedValue({ code: "OK" });
  render(<ContactRecordForm participationId="fictitious" version={1} onSubmit={submit} />);
  const date = screen.getByLabelText("Fecha y hora (Funes)") as HTMLInputElement;
  const summary = screen.getByLabelText("Resumen interno") as HTMLInputElement;
  fireEvent.change(summary, { target: { value: "Resumen ficticio conservado." } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contacto" }));
  expect(submit).not.toHaveBeenCalled(); expect(date.getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement).toBe(date); expect(summary.value).toBe("Resumen ficticio conservado.");
  expect(screen.getByText("Completá este campo.")).toBeTruthy();
  fireEvent.change(date, { target: { value: "2026-02-28T12:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contacto" }));
  await waitFor(() => expect(submit).toHaveBeenCalledOnce());
});
it("conserva fecha y resumen ante rechazo del servidor", async () => {
  const submit = vi.fn().mockResolvedValue({ code: "CONFLICT_STALE_DATA" });
  render(<ContactRecordForm participationId="fictitious" version={1} onSubmit={submit} />);
  const date = screen.getByLabelText("Fecha y hora (Funes)") as HTMLInputElement;
  fireEvent.change(date, { target: { value: "2026-09-20T12:00" } });
  fireEvent.change(screen.getByLabelText("Resumen interno"), { target: { value: "Contacto ficticio retenido." } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contacto" }));
  await screen.findByText(/El registro cambió mientras lo editabas/);
  expect(date.value).toBe("2026-09-20T12:00"); expect(screen.getByDisplayValue("Contacto ficticio retenido.")).toBeTruthy();
});
