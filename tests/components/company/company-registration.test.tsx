import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn(async () => ({ message: "", success: false })) }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), passwordAction: vi.fn() }));
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

const defaults = { legalName: "Empresa ficticia", responsibleName: "Responsable ficticio", email: "empresa@example.invalid", cuit: "30999999997", activity: "Servicios", password: "Fictitious-123", confirmation: "Fictitious-123" };

describe("validación del registro de empresa", () => {
  it("conserva los nueve obligatorios, incluidos los términos, sin mensajes repetidos", () => {
    const { container } = render(<CompanyRegistrationForm homepageLayout />);
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta de empresa" }));
    expect(screen.getByText("Revisá los 9 campos indicados.")).toBeTruthy();
    expect(container.querySelectorAll('[data-marker-state="missing"]')).toHaveLength(9);
    expect(container.querySelectorAll("[data-field-error]")).toHaveLength(1);
    expect(screen.getByText("Confirmá esta opción para continuar.")).toBeTruthy();
    expect(screen.getByLabelText("Nombre de la empresa")).toBe(document.activeElement);
    expect(screen.getByRole("combobox", { name: "Localidad" }).getAttribute("aria-invalid")).toBe("true");
  });

  it("enfoca Localidad cuando es el primer error y corrige resumen, marcador y FormData al elegir", async () => {
    const { container } = render(<CompanyRegistrationForm homepageLayout defaultValues={defaults} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta de empresa" }));
    expect(screen.getByText("Revisá el campo indicado.")).toBeTruthy();
    const trigger = screen.getByRole("combobox", { name: "Localidad" });
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole("option", { name: "Funes" }));
    await waitFor(() => expect(screen.queryByText("Revisá el campo indicado.")).toBeNull());
    expect(trigger.getAttribute("aria-invalid")).not.toBe("true");
    expect(container.querySelectorAll('[data-marker-state="missing"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-marker-state="muted"]')).toHaveLength(9);
    expect(new FormData(container.querySelector("form")!).getAll("locality")).toEqual(["Funes"]);
  });
});
