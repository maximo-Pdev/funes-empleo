import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({
  loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(),
}));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));

import HomePage from "@/app/(public)/page";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

afterEach(cleanup);

describe("Home access panel", () => {
  it("offers recovery below a separator after sign-in, outside the form and only in login mode", () => {
    render(<HomePage />);
    const submit = screen.getByRole("button", { name: "Ingresar" });
    const separator = screen.getByRole("separator");
    const recovery = screen.getByRole("link", { name: "Recuperar acceso" });
    expect(recovery.getAttribute("href")).toBe("/recover");
    expect(recovery.closest("form")).toBeNull();
    expect(submit.compareDocumentPosition(separator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(separator.compareDocumentPosition(recovery) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(screen.queryByRole("link", { name: "Recuperar acceso" })).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(screen.queryByRole("link", { name: "Recuperar acceso" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByRole("link", { name: "Recuperar acceso" })).toBeTruthy();
  });

  it("explains required asterisks below both registration forms but not login", () => {
    render(<HomePage />);
    const note = "Los campos marcados con * son obligatorios.";
    expect(screen.queryByText(note)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(screen.getByText(note)).toBeTruthy();
    expect((document.querySelector("form")?.compareDocumentPosition(screen.getByText(note)) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(screen.getAllByText(note)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.queryByText(note)).toBeNull();
  });

  it("orders company fields into the requested rows without requiring the optional phone", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    const phone = screen.getByLabelText("Teléfono de contacto") as HTMLInputElement;
    const activity = screen.getByLabelText("Actividad") as HTMLInputElement;
    const locality = screen.getByLabelText("Localidad");
    const cuit = screen.getByLabelText("CUIT");
    const responsible = screen.getByLabelText("Persona responsable");
    const email = screen.getByLabelText("Correo electrónico");
    expect(responsible.closest("label")?.parentElement?.tagName).toBe("DIV");
    expect(responsible.closest("label")?.parentElement?.contains(email)).toBe(true);
    expect(responsible.closest("label")?.parentElement?.children).toHaveLength(2);
    const row = phone.closest("label")?.parentElement;
    expect(row?.tagName).toBe("DIV");
    expect(row?.contains(locality)).toBe(true);
    expect(row?.children).toHaveLength(2);
    expect(cuit.closest("label")?.parentElement?.contains(activity)).toBe(true);
    expect(cuit.closest("label")?.parentElement?.children).toHaveLength(2);
    expect([...phone.form!.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')].map(input => input.name)).toEqual([
      "legalName", "responsibleName", "email", "cuit", "activity", "locality", "phone", "password", "confirmation",
    ]);
    expect(phone.required).toBe(false);
    expect(activity.required).toBe(true);
    expect(screen.queryByText(/\(opcional\)/i)).toBeNull();
    expect(screen.getByRole("region", { name: "Acceso al portal" }).parentElement?.getAttribute("data-layout")).toBe("company");
  });

  it("removes the portal title while preserving the animated access card", () => {
    render(<HomePage />);
    const panel = screen.getByRole("region", { name: "Acceso al portal" });
    expect(screen.queryByText("Portal Municipal de Empleo de Funes")).toBeNull();
    expect(screen.getByRole("heading", { name: "El empleo en Funes, con acompañamiento municipal." })).toBeTruthy();
    expect(panel.getAttribute("data-mode")).toBe("login");
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(panel.getAttribute("data-mode")).toBe("register");
    const roles = screen.getByRole("group", { name: "Tipo de cuenta" });
    expect(roles.contains(screen.getByRole("radio", { name: "Postulante" }))).toBe(true);
    expect(roles.contains(screen.getByRole("radio", { name: "Empresa" }))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(panel.getAttribute("data-mode")).toBe("login");
  });

  it("preserves login and password-change guidance while removing only the registration privacy hint", () => {
    const view = render(<AuthForm mode="login" />);
    expect(screen.getByText("No compartas tu contraseña.")).toBeTruthy();
    expect(screen.queryByText(/Entre 6 y 128 caracteres/)).toBeNull();
    view.rerender(<AuthForm mode="password" />);
    expect(screen.getByText("Entre 6 y 128 caracteres. No compartas tu contraseña.")).toBeTruthy();
    view.rerender(<CandidateRegistrationForm />);
    expect(screen.queryByText(/No compartas tu contraseña/)).toBeNull();
    expect(screen.getByText("Entre 6 y 128 caracteres.")).toBeTruthy();
    view.rerender(<CompanyRegistrationForm />);
    expect(screen.queryByText(/No compartas tu contraseña/)).toBeNull();
    expect(screen.getByText("Entre 6 y 128 caracteres.")).toBeTruthy();
  });

  it("shows the sign-in form by default", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: "Iniciar sesión" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Correo electrónico")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña", { exact: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ingresar" }).getAttribute("type")).toBe("submit");
    expect(screen.queryByRole("group", { name: "Tipo de cuenta" })).toBeNull();
  });

  it("switches between candidate and company registration and back to sign-in", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(screen.getByRole("group", { name: "Tipo de cuenta" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Postulante" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByLabelText("DNI")).toBeTruthy();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrarse", pressed: true })).toBeTruthy();
    expect(document.querySelector('button[type="submit"]')?.textContent).toBe("Registrarse");
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(screen.getByLabelText("CUIT")).toBeTruthy();
    expect(screen.queryByLabelText("DNI")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Tipo de cuenta" })).toBeNull();
  });

  it("preserves the original labels on existing authentication pages", () => {
    const view = render(<AuthForm mode="login" />);
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    view.rerender(<CandidateRegistrationForm />);
    expect(screen.getByRole("button", { name: "Crear cuenta candidata" })).toBeTruthy();
    view.rerender(<CompanyRegistrationForm />);
    expect(screen.getByRole("button", { name: "Crear cuenta de empresa" })).toBeTruthy();
    expect((screen.getByLabelText("Teléfono de contacto (opcional)") as HTMLInputElement).required).toBe(false);
    expect(document.querySelector("[data-company-field-row]")).toBeNull();
  });
});
