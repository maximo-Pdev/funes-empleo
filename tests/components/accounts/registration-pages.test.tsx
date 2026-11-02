import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), passwordAction: vi.fn() }));
import { HomeHero } from "@/app/(public)/home-hero";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import homeStyles from "@/app/(public)/home.module.css";

it.each(["candidate", "company"] as const)("keeps %s legal acceptance without the visible new-tab suffix", role => {
  const view = render(<HomeHero authenticated={false} initialView={role} />);
  const panel = screen.getByRole("region", { name: "Acceso al portal" });
  const link = within(panel).getByRole("link", { name: "Términos de uso y aviso de privacidad" });
  expect(link.getAttribute("href")).toBe("/terminos");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  // Keep the assertion after fixture export so RED also supplies browser geometry.
  const checkbox = panel.querySelector<HTMLInputElement>('input[name="termsAccepted"]')!;
  expect(checkbox.required).toBe(true);
  expect(checkbox.checked).toBe(false);
  expect(panel.querySelector('input[name="termsVersion"]')).toBeTruthy();

  const output = process.env.HOME_REGISTRATION_FIXTURE_DIR;
  if (output) {
    const css = readFileSync("src/app/(public)/home.module.css", "utf8")
      .replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => homeStyles[name] ? `.${homeStyles[name]}` : selector)
      .replace(/:global\(([^)]+)\)/g, "$1");
    mkdirSync(output, { recursive: true });
    writeFileSync(path.join(output, `${role}.json`), JSON.stringify({ html: view.container.innerHTML, css }));
  }
  expect(panel.textContent).not.toContain("(se abre en otra pestaña)");
});

it.each([["candidate", "Postulante", "Tu próximo paso laboral empieza acá.", 7], ["company", "Empresa", "Encontrá talento para tu empresa.", 10]] as const)("conserva los campos de %s en el acceso de Home", (role, label, heading, fields) => {
  const view = render(<HomeHero authenticated={false} initialView={role} />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
  const panel = screen.getByRole("region", { name: "Acceso al portal" });
  const form = panel.querySelector("form")!;
  const inputNames = [...form.querySelectorAll("input")].map(input => input.getAttribute("name")).filter((name): name is string => name !== null);
  if (role === "company") expect(inputNames).toEqual(["legalName", "responsibleName", "email", "cuit", "activity", "locality", "phone", "password", "confirmation", "termsVersion", "termsAccepted"]);
  else expect(inputNames).toHaveLength(fields);
  expect(view.container.querySelectorAll("#acceso")).toHaveLength(1);
  expect(screen.getByRole("radio", { name: label })).toHaveProperty("checked", true);
  expect(within(form).getByRole("button", { name: role === "candidate" ? "Crear cuenta candidata" : "Crear cuenta de empresa" }).getAttribute("type")).toBe("submit");
  expect(screen.getByLabelText("Contraseña")).toHaveProperty("required", true);
  expect(screen.getByLabelText("Confirmar contraseña")).toHaveProperty("required", true);
  expect(screen.getByText("Los campos marcados con * son obligatorios.")).toBeTruthy();
  expect(screen.getByRole("list", { name: "Pasos para empezar" }).children).toHaveLength(3);
  expect(screen.getByRole("link", { name: "Ver ofertas disponibles" }).getAttribute("href")).toBe("#ofertas-disponibles");
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
  expect(screen.getByRole("link", { name: "Recuperar acceso" }).getAttribute("href")).toBe("/recover");
});

it("preserva el aviso empresarial y la intermediación municipal", () => {
  render(<HomeHero authenticated={false} initialView="company" />);
  expect(screen.getByText("Sin verificación documental")).toBeTruthy();
  expect(screen.getByText(/no acredita la identidad de la empresa/)).toBeTruthy();
  expect(screen.getByText(/únicamente a los candidatos derivados/)).toBeTruthy();
});
