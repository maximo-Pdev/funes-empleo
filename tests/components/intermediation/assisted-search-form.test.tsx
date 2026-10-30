import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
const id = "0a000000-0000-4000-8000-000000000001";
const reference = "rub-0123456789abcdef01234567";

it("busca en el apartado presencial conservando categoría opaca y filtros", () => {
  render(<CandidateSearchForm destination="/admin/atencion-presencial" categories={[{ id, name: "Administración", reference }]}
    initial={{ eligibility: "all" }} />);
  fireEvent.change(screen.getByLabelText("Búsqueda por palabra"), { target: { value: "Persona ficticia" } });
  fireEvent.click(screen.getByLabelText("Categorías"));
  fireEvent.click(screen.getByRole("option", { name: "Administración" }));
  const form = screen.getByRole("search") as HTMLFormElement;
  expect(form.method).toBe("get");
  const url = new URL(form.getAttribute("action")!, "http://fixture.invalid");
  url.search = new URLSearchParams(Array.from(new FormData(form), ([key, value]) => [key, String(value)])).toString();
  expect(url.pathname).toBe("/admin/atencion-presencial");
  expect(url.searchParams.getAll("categoryId")).toEqual([reference]);
  expect(url.searchParams.get("term")).toBe("Persona ficticia");
  expect(url.searchParams.get("eligibility")).toBe("all");
});
it("mantiene categorías abiertas al elegir y cierra con Escape conservando el GET", async () => {
  render(<CandidateSearchForm categories={[{ id, name: "Administración", reference }]} />);
  fireEvent.click(screen.getByLabelText("Categorías"));
  fireEvent.click(screen.getByRole("option", { name: "Administración" }));
  expect(screen.getByRole("dialog", { name: "Elegir categorías" })).toBeTruthy();
  expect(screen.getByRole("listbox", { name: "Categorías: opciones" })).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Categorías" }).getAttribute("aria-expanded")).toBe("true");
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Buscar categoría" }), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("listbox", { name: "Categorías: opciones" })).toBeNull());
  expect(screen.getByRole("combobox", { name: "Categorías" }).textContent).toContain("1 seleccionadas");
  const form = screen.getByRole("search") as HTMLFormElement;
  expect(form.method).toBe("get");
  expect(form.getAttribute("action")).toBe("/admin/candidates");
  expect(new FormData(form).getAll("categoryId")).toEqual([reference]);
});
it("conserva el destino y defaults de búsqueda general", () => {
  render(<CandidateSearchForm categories={[]} />);
  const form = screen.getByRole("search") as HTMLFormElement;
  expect(form.method).toBe("get");
  const url = new URL(form.getAttribute("action")!, "http://fixture.invalid");
  url.search = new URLSearchParams(Array.from(new FormData(form), ([key, value]) => [key, String(value)])).toString();
  expect(url.pathname).toBe("/admin/candidates");
  expect(url.searchParams.get("eligibility")).toBe("eligible");
});
