import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
import Candidate from "@/app/(auth)/registro/candidato/page";
import Company from "@/app/(auth)/registro/empresa/page";

it.each([["Registro de candidatos", Candidate, 5], ["Registro de empresas", Company, 9]] as const)("conserva campos y accesos de %s en dos tarjetas", (title, Page, fields) => {
  const view = render(<Page />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { name: title })).toBeTruthy();
  expect(view.container.querySelectorAll("[data-registration-card]")).toHaveLength(2);
  expect(view.container.querySelectorAll("input")).toHaveLength(fields);
  for (const label of ["Ya tengo cuenta", "Recuperar acceso", "Ayuda para verificar mi correo"]) expect(screen.getByRole("link", { name: label })).toBeTruthy();
  expect(screen.getByLabelText("Contraseña")).toHaveProperty("required", true);
  expect(screen.getByLabelText("Confirmar contraseña")).toHaveProperty("required", true);
  const navigation = within(screen.getByRole("navigation", { name: "Tipo de registro" }));
  const candidate = navigation.getByRole("link", { name: "Soy postulante" });
  const company = navigation.getByRole("link", { name: "Soy empresa" });
  expect(candidate.getAttribute("href")).toBe("/registro/candidato");
  expect(company.getAttribute("href")).toBe("/registro/empresa");
  expect(candidate.getAttribute("aria-current")).toBe(Page === Candidate ? "page" : null);
  expect(company.getAttribute("aria-current")).toBe(Page === Company ? "page" : null);
});

it("preserva el aviso empresarial y la intermediación municipal", () => {
  render(<Company />);
  expect(screen.getByText("Sin verificación documental en el MVP")).toBeTruthy();
  expect(screen.getByText(/no acredita la identidad de la empresa/)).toBeTruthy();
  expect(screen.getByText(/únicamente a los candidatos derivados/)).toBeTruthy();
});
