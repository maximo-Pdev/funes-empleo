import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";

const categories = [
  { id: "category-a", name: "Administración", reference: "ref-a" },
  { id: "category-b", name: "Comercio", reference: "ref-b" },
];

it("conserva filtros GET y etiquetas al cerrar y enviar categorías repetidas", async () => {
  render(<CandidateSearchForm categories={categories} initial={{ categoryId: ["category-a"], term: "Ficticia", locality: "Funes", availability: "available", eligibility: "all" }} />);
  const tags = screen.getByRole("list", { name: "Categorías seleccionadas" });
  expect(within(tags).getByText("Administración")).toBeTruthy();
  const trigger = screen.getByRole("combobox", { name: "Categorías" });
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByRole("option", { name: "Comercio" }));
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("listbox", { name: "Categorías: opciones" })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Buscar categoría" }), { key: "Escape" });
  await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(within(tags).getByText("Comercio")).toBeTruthy();
  const form = screen.getByRole("search") as HTMLFormElement;
  expect(form.method).toBe("get");
  expect(form.getAttribute("action")).toBe("/admin/candidates");
  const url = new URL(form.getAttribute("action")!, "http://fixture.invalid");
  url.search = new URLSearchParams(Array.from(new FormData(form), ([key, value]) => [key, String(value)])).toString();
  expect(url.searchParams.getAll("categoryId")).toEqual(["ref-a", "ref-b"]);
  expect(url.searchParams.get("locality")).toBe("Funes");
  expect(url.searchParams.get("term")).toBe("Ficticia");
  expect(url.searchParams.get("availability")).toBe("available");
  expect(url.searchParams.get("eligibility")).toBe("all");
  expect(new FormData(form).getAll("locality")).toEqual(["Funes"]);
  expect(new FormData(form).has("page")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Quitar Administración" }));
  expect(new FormData(form).getAll("categoryId")).toEqual(["ref-b"]);
});

it("permite búsquedas sin categoría ni localidad y omite categorías sin referencia", () => {
  render(<CandidateSearchForm categories={[{ id: "raw-category", name: "Sin referencia" }]} initial={{ categoryId: ["raw-category"] }} />);
  const form = screen.getByRole("search") as HTMLFormElement;
  expect(new FormData(form).getAll("categoryId")).toEqual([]);
  expect(new FormData(form).get("locality")).toBe("");
  expect(form.checkValidity()).toBe(true);
  expect(screen.getByRole("combobox", { name: "Categorías" }).getAttribute("aria-required")).toBe("false");
});
