import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const categories = [
  { id: "category-a", name: "Administración", reference: "ref-a" },
  { id: "category-b", name: "Comercio", reference: "ref-b" },
];

it("conserva filtros controlados y etiquetas al cerrar y enviar categorías repetidas", async () => {
  render(<CandidateSearchForm categories={categories} initial={{ categoryId: ["category-a"], term: "Ficticia", locality: "Funes", availability: "available", eligibility: "all" }} />);
  const tags = screen.getByRole("list", { name: "Categorías seleccionadas" });
  expect(within(tags).getByText("Administración")).toBeTruthy();
  const trigger = screen.getByRole("combobox", { name: "Categorías" });
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByRole("option", { name: "Comercio" }));
  await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(within(tags).getByText("Comercio")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Buscar candidatos" }));
  const url = new URL(push.mock.calls.at(-1)![0], "http://localhost");
  expect(url.searchParams.getAll("categoryId")).toEqual(["ref-a", "ref-b"]);
  expect(url.searchParams.get("locality")).toBe("Funes");
  expect(url.searchParams.get("term")).toBe("Ficticia");
  expect(url.searchParams.get("availability")).toBe("available");
  expect(url.searchParams.get("eligibility")).toBe("all");
  fireEvent.click(screen.getByRole("button", { name: "Quitar Administración" }));
  fireEvent.click(screen.getByRole("button", { name: "Buscar candidatos" }));
  expect(new URL(push.mock.calls.at(-1)![0], "http://localhost").searchParams.getAll("categoryId")).toEqual(["ref-b"]);
});
