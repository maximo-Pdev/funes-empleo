import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BoundedList } from "@/components/ui/bounded-list";

afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });
const rows = (count: number) => Array.from({ length: count }, (_, index) => <li key={index} id={`registro-${index + 1}`}>Registro {index + 1}</li>);

it("muestra cinco eventos y permite llegar al final sin perder ni duplicar registros", () => {
  render(<BoundedList label="Historial">{rows(12)}</BoundedList>);
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "Mostrar más: Historial" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(10);
  expect(document.activeElement).toBe(screen.getByText("Registro 6"));
  fireEvent.click(screen.getByRole("button", { name: "Mostrar más: Historial" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByRole("status").textContent).toContain("1–12 de 12");
});

it("pagina diez perfiles con última página incompleta y regreso al principio", () => {
  render(<BoundedList mode="pages" label="Perfiles">{rows(21)}</BoundedList>);
  const list = screen.getByText("Registro 1").parentElement!;
  expect(within(list).getAllByRole("listitem")).toHaveLength(10);
  expect(screen.getByRole("button", { name: "Anterior" })).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(screen.queryByText("Registro 1")).toBeNull();
  expect(document.activeElement).toBe(screen.getByText("Registro 11"));
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Registro 21")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Siguiente" })).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  expect(screen.getByText("Registro 1")).toBeTruthy();
});

it("abre el registro del hash aunque esté fuera de los primeros diez", () => {
  window.history.replaceState(null, "", "/#registro-17");
  render(<BoundedList mode="pages" label="Participaciones">{rows(23)}</BoundedList>);
  expect(screen.queryByText("Registro 1")).toBeNull();
  expect(document.activeElement).toBe(screen.getByText("Registro 17"));
  expect(screen.getByRole("status").textContent).toContain("11–20 de 23");
});

it("incluye la derivación seleccionada y no agrega controles al bloque pequeño", () => {
  const view = render(<BoundedList mode="pages" label="Derivaciones" initialIndex={25}>{rows(28)}</BoundedList>);
  expect(screen.getByText("Registro 26")).toBeTruthy();
  expect(screen.queryByText("Registro 1")).toBeNull();
  view.unmount();
  render(<BoundedList label="Notas">{rows(5)}</BoundedList>);
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
  expect(screen.queryByRole("button")).toBeNull();
});
