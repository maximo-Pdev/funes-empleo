import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Form } from "@/components/forms/form";
import { CategoryMultiSelect } from "@/features/candidates/components/category-multi-select";
import { AssistedProfileForm } from "@/features/candidates/components/assisted/assisted-forms";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/features/candidates/assisted-actions", () => ({ saveAssistedAction: vi.fn(), assistedCommandAction: vi.fn() }));
vi.mock("@/features/candidates/claim-actions", () => ({ claimAssistedAction: vi.fn() }));

const categories = [
  { id: "0a000000-0000-4000-8000-000000000011", name: "Categoría ficticia A" },
  { id: "0a000000-0000-4000-8000-000000000012", name: "Categoría ficticia B" },
];

it("conserva categorías obligatorias en alta asistida y opcionales en mantenimiento", () => {
  const { rerender } = render(<AssistedProfileForm categories={categories} />);
  expect(screen.getByRole("combobox", { name: "Categorías laborales" }).getAttribute("aria-required")).toBe("true");
  rerender(<AssistedProfileForm categories={categories} candidateId="candidate-a" version={1} />);
  expect(screen.getByRole("combobox", { name: "Categorías laborales" }).getAttribute("aria-required")).toBe("false");
});

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

it("muestra etiquetas con nombres y permite quitar una selección sin enviar el formulario", async () => {
  const submit = vi.fn(event => event.preventDefault());
  const { container } = render(<Form onSubmit={submit}><CategoryMultiSelect categories={categories} defaultSelected={[categories[0]!.id]} /><button type="submit">Guardar etiquetas</button></Form>);
  const tags = screen.getByRole("list", { name: "Categorías seleccionadas" });
  expect(within(tags).getByText(categories[0]!.name)).toBeTruthy();
  fireEvent.click(screen.getByRole("combobox", { name: "Categorías laborales" }));
  fireEvent.click(await screen.findByRole("option", { name: categories[1]!.name }));
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Buscar categoría" }), { key: "Escape" });
  expect(within(tags).getByText(categories[1]!.name)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: `Quitar ${categories[0]!.name}` }));
  expect(within(tags).queryByText(categories[0]!.name)).toBeNull();
  expect(new FormData(container.querySelector("form")!).getAll("categories")).toEqual([categories[1]!.id]);
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Guardar etiquetas" }));
  expect(submit).toHaveBeenCalledOnce();
});

it("refleja actualizaciones controladas sin reemplazar las opciones del catálogo", () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<Form><CategoryMultiSelect categories={categories} value={[categories[0]!.id]} onChange={onChange} name="categoryId" /></Form>);
  rerender(<Form><CategoryMultiSelect categories={categories} value={[categories[1]!.id]} onChange={onChange} name="categoryId" /></Form>);
  expect(screen.getByRole("list", { name: "Categorías seleccionadas" }).textContent).toContain(categories[1]!.name);
  expect(new FormData(container.querySelector("form")!).getAll("categoryId")).toEqual([categories[1]!.id]);
  fireEvent.click(screen.getByRole("button", { name: `Quitar ${categories[1]!.name}` }));
  expect(onChange).toHaveBeenCalledWith([]);
  expect(new FormData(container.querySelector("form")!).getAll("categoryId")).toEqual([categories[1]!.id]);
});

it("mantiene el desplegable abierto para elegir más de una categoría", async () => {
  render(<Form><CategoryMultiSelect categories={categories} /></Form>);
  fireEvent.click(screen.getByRole("combobox", { name: "Categorías laborales" }));
  fireEvent.click(await screen.findByRole("option", { name: "Categoría ficticia A" }));
  fireEvent.click(screen.getByRole("option", { name: "Categoría ficticia B" }));
  expect(screen.getByRole("combobox", { name: "Categorías laborales" }).textContent).toContain("2 seleccionadas");
});
