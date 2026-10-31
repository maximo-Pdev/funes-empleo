import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";
import type { CompanyOffer } from "@/features/openings/company-service";

const save = vi.hoisted(() => vi.fn(async (...args: [unknown, FormData]) => {
  void args;
  return { message: "Guardado ficticio", success: false };
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/features/openings/company-actions", () => ({ saveCompanyOpeningAction: save, submitCompanyOpeningAction: vi.fn(), cancelCompanyOpeningAction: vi.fn() }));
const categories = [{ id: "category-a", name: "Administración" }, { id: "category-b", name: "Comercio" }];
const opening: CompanyOffer = { id: "opening-a", title: "Oferta ficticia", tasks: "Tareas ficticias", requirements: "Requisitos ficticios", vacancies: 1,
  location: "Funes", modality: "onsite", schedule: "Completo", contract_type: "permanent", closingDate: "2026-12-01", salary: null, benefits: null,
  status: "draft", version: 1, createdAt: "2026-10-22", categories: [categories[0]!], history: [] };

it("bloquea una oferta publicada si se quita la última categoría y permite corregirla", async () => {
  save.mockClear();
  render(<CompanyOpeningForm opening={{ ...opening, status: "published" }} categories={categories} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
  fireEvent.click(screen.getByRole("button", { name: "Quitar Administración" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios y enviar a revisión" }));
  expect(screen.getByText("Revisá el campo indicado.")).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
  const trigger = screen.getByRole("combobox", { name: "Categorías" });
  expect(trigger.getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByRole("option", { name: "Comercio" }));
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Buscar categoría" }), { key: "Escape" });
  await waitFor(() => expect(trigger.getAttribute("aria-invalid")).toBe("false"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios y enviar a revisión" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(save.mock.calls[0]![1].getAll("categories")).toEqual(["category-b"]);
});

it("edita categorías guardadas mediante opciones y envía todos los IDs seleccionados", async () => {
  render(<CompanyOpeningForm opening={opening} categories={categories} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
  const tags = screen.getByRole("list", { name: "Categorías seleccionadas" });
  expect(within(tags).getByText("Administración")).toBeTruthy();
  fireEvent.click(screen.getByRole("combobox", { name: "Categorías" }));
  fireEvent.click(await screen.findByRole("option", { name: "Comercio" }));
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Buscar categoría" }), { key: "Escape" });
  expect(within(tags).getByText("Comercio")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(save.mock.calls[0]![1].getAll("categories")).toEqual(["category-a", "category-b"]);
  expect(save.mock.calls[0]![1].get("version")).toBe("1");
});
