import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
vi.mock("@/features/accounts/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/courses" }));
import { AdminShell } from "@/app/(admin)/_components/admin-shell";

it("makes course administration reachable through the shared sidebar", () => {
  render(<AdminShell title="Cursos y derivaciones" active="/admin/courses"><p>Curso ficticio</p></AdminShell>);
  const navigation = screen.getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
  const courses = within(navigation).getByRole("link", { name: "Cursos" });
  expect(courses.getAttribute("href")).toBe("/admin/courses");
  expect(courses.getAttribute("aria-current")).toBe("page");
  expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
});
