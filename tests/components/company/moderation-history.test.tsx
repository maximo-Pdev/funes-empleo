import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ModerationHistory, type ModerationHistoryEvent } from "@/features/openings/components/moderation-history";

const events: ModerationHistoryEvent[] = Array.from({ length: 12 }, (_, index) => ({
  id: String(index), decision: "submitted", previousStatus: "published", newStatus: "pending_review",
  at: `2026-10-${String(24 - index).padStart(2, "0")}T18:00:00Z`, message: `Mensaje ${index + 1}`,
}));

it("muestra cinco eventos recientes y revela cinco más con foco y anuncio", () => {
  render(<ModerationHistory events={events} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
  expect(screen.getByText("Mensaje de la Oficina: Mensaje 1")).toBeTruthy();
  expect(screen.queryByText("Mensaje de la Oficina: Mensaje 6")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar más" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(10);
  expect(document.activeElement).toBe(screen.getAllByRole("listitem")[5]);
  expect(screen.getByRole("status").textContent).toBe("10 de 12 eventos visibles.");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar más" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
  expect(screen.queryByRole("button", { name: "Mostrar más" })).toBeNull();
});

it("muestra vacío y no agrega datos privados ausentes en la proyección", () => {
  const view = render(<ModerationHistory events={[]} />);
  expect(screen.getByText("Sin decisiones registradas")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(<ModerationHistory events={events.slice(0, 1)} />);
  expect(screen.queryByText(/Motivo interno/)).toBeNull();
  expect(screen.getByText(/15:00:00/)).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(<ModerationHistory events={events.slice(0, 5)} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(<ModerationHistory events={[{ ...events[0]!, internalReason: "Motivo ficticio", actorLabel: "Administración" }]} />);
  expect(screen.getByText("Motivo interno: Motivo ficticio")).toBeTruthy();
  expect(screen.getByText(/Administración/)).toBeTruthy();
});
