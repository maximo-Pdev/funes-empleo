import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
const id = "0a000000-0000-4000-8000-000000000001";
const reference = "rub-0123456789abcdef01234567";
beforeEach(() => vi.clearAllMocks());

it("busca en el apartado presencial conservando categoría opaca y filtros", () => {
  render(<CandidateSearchForm destination="/admin/atencion-presencial" categories={[{ id, name: "Administración", reference }]}
    initial={{ eligibility: "all" }} />);
  fireEvent.change(screen.getByLabelText("Búsqueda por palabra"), { target: { value: "Persona ficticia" } });
  fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: id } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar candidatos" }));
  const url = new URL(mocks.push.mock.calls[0]![0], "http://fixture.invalid");
  expect(url.pathname).toBe("/admin/atencion-presencial");
  expect(url.searchParams.get("categoryId")).toBe(reference);
  expect(url.searchParams.get("term")).toBe("Persona ficticia");
  expect(url.searchParams.get("eligibility")).toBe("all");
});
it("conserva el destino y defaults de búsqueda general", () => {
  render(<CandidateSearchForm categories={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Buscar candidatos" }));
  const url = new URL(mocks.push.mock.calls[0]![0], "http://fixture.invalid");
  expect(url.pathname).toBe("/admin/candidates");
  expect(url.searchParams.get("eligibility")).toBe("eligible");
});
