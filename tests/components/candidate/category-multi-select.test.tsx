import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Form } from "@/components/forms/form";
import { CategoryMultiSelect } from "@/features/candidates/components/category-multi-select";

const categories = [
  { id: "0a000000-0000-4000-8000-000000000011", name: "Categoría ficticia A" },
  { id: "0a000000-0000-4000-8000-000000000012", name: "Categoría ficticia B" },
];

it("nombra el diálogo y la lista de categorías y los opera con el teclado", async () => {
  const submit = vi.fn(event => event.preventDefault());
  const { container } = render(<Form onSubmit={submit}>
    <CategoryMultiSelect categories={categories} />
    <button type="submit">Guardar</button>
  </Form>);
  const trigger = screen.getByRole("combobox", { name: "Categorías laborales" });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });

  const dialog = await screen.findByRole("dialog", { name: "Elegir categorías laborales" });
  expect(dialog).toBeTruthy();
  expect(screen.getByRole("listbox", { name: "Categorías laborales: opciones" })).toBeTruthy();

  const input = screen.getByRole("combobox", { name: "Buscar categoría" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });

  const form = container.querySelector("form")!;
  await waitFor(() => expect(new FormData(form).getAll("categories")).toEqual([categories[0]!.id]));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(submit).toHaveBeenCalledOnce();
});

it("mantiene el desplegable abierto para elegir más de una categoría", async () => {
  render(<Form><CategoryMultiSelect categories={categories} /></Form>);
  fireEvent.click(screen.getByRole("combobox", { name: "Categorías laborales" }));
  fireEvent.click(await screen.findByRole("option", { name: "Categoría ficticia A" }));
  fireEvent.click(screen.getByRole("option", { name: "Categoría ficticia B" }));
  expect(screen.getByRole("combobox", { name: "Categorías laborales" }).textContent).toContain("2 seleccionadas");
});
