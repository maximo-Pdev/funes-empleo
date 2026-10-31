import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

it("publica el texto completo, las fuentes y los pendientes municipales sin exigir sesión", async () => {
  const { default: TermsPage } = await import("@/app/(public)/terminos/page");
  render(<TermsPage />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "Términos de uso y aviso de privacidad" })).toBeTruthy();
  expect(screen.getByText(/demo-terms-draft-1/)).toBeTruthy();
  expect(screen.getByText(/No aprobado para producción/)).toBeTruthy();
  expect(screen.getByRole("heading", { name: "8. Versiones y aceptación" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Pendientes antes de publicar una versión legal definitiva" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Ley 25.326/ }).getAttribute("href")).toContain("infoleg");
  expect(screen.getByText(/No se declara aprobado un responsable/)).toBeTruthy();
});

it.each([CandidateRegistrationForm, CompanyRegistrationForm])("requiere aceptación explícita con texto disponible antes del registro", Component => {
  const view = render(<Component homepageLayout />);
  const checkbox = screen.getByRole("checkbox", { name: /He leído y acepto los términos/ });
  expect(checkbox).toHaveProperty("required", true);
  expect(checkbox).toHaveProperty("checked", false);
  expect(screen.getByRole("link", { name: "Términos de uso y aviso de privacidad" }).getAttribute("href")).toBe("/terminos");
  const form = view.container.querySelector("form")!;
  expect(new FormData(form).get("termsVersion")).toBe("demo-terms-draft-1");
  expect(new FormData(form).get("termsAccepted")).toBeNull();
  fireEvent.click(checkbox);
  expect(new FormData(form).get("termsAccepted")).toBe("on");
});
