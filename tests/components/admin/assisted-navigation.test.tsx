import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
import { AdminShell } from "@/app/(admin)/_components/admin-shell";

it("ofrece atención presencial como apartado propio con un único menú activo", () => {
  render(<AdminShell active="/admin/atencion-presencial" title="Perfil asistido"><p>Perfiles asistidos</p></AdminShell>);
  const navigation = screen.getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
  const assisted = within(navigation).getByRole("link", { name: "Perfil asistido" });
  expect(assisted.getAttribute("href")).toBe("/admin/atencion-presencial");
  expect(assisted.getAttribute("aria-current")).toBe("page");
  expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(within(navigation).getByRole("link", { name: "Candidatos" }).getAttribute("aria-current")).toBeNull();
});
