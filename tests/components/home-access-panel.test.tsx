import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({
  loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(),
}));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));

import HomePage from "@/app/(public)/page";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import { readAccountSession } from "@/lib/auth/session";

afterEach(cleanup);

describe("Home access panel", () => {
  it.each([
    ["Postulante", "Tu próximo paso laboral empieza acá.", [
      "Creá tu cuenta y prepará tu perfil para postularte a las ofertas del portal.",
      "Completá tus datos de acceso en este formulario.",
      "Seguí el enlace que recibirás por email.",
      "Después de ingresar, agregá tu experiencia, intereses y CV desde tu panel.",
      "La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.",
    ]],
    ["Empresa", "Encontrá talento para tu empresa.", [
      "Gestioná tus búsquedas laborales con el acompañamiento de la Oficina de Empleo de Funes.",
      "Registrá tu empresa y verificá tu correo para ingresar.",
      "Guardá un borrador y envialo a revisión municipal antes de su publicación.",
      "La Oficina preselecciona y deriva candidatos para tus ofertas.",
      "Sin verificación documental en el MVP",
      "Verificar el correo confirma el acceso a la cuenta; no acredita la identidad de la empresa. Cada oferta requiere revisión municipal.",
      "Las empresas acceden únicamente a los candidatos derivados por la Oficina a sus propias ofertas.",
    ]],
  ])("matches the original %s guide and restores the login introduction", async (role, title, texts) => {
    render(await HomePage());
    const original = screen.getByRole("heading", { level: 1 }).parentElement!.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    fireEvent.click(screen.getByRole("radio", { name: role }));
    const intro = screen.getByRole("heading", { level: 1, name: title }).parentElement!;
    for (const text of texts) expect(within(intro).getByText(text)).toBeTruthy();
    expect(within(intro).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByText("El empleo en Funes, con acompañamiento municipal.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByRole("heading", { level: 1 }).parentElement!.textContent).toBe(original);
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: role === "Empresa" ? "Postulante" : "Empresa" }));
    expect(screen.queryByRole("heading", { level: 1, name: title })).toBeNull();
  });

  it.each([
    ["candidate", "Ir al panel de usuario"],
    ["company", "Ir al panel de empresa"],
    ["admin", "Ir al panel de administración"],
  ])("replaces login for an active %s but keeps both registration forms usable", async (role, label) => {
    vi.mocked(readAccountSession).mockResolvedValueOnce({ account: { role, status: "active" } } as never);
    const view = render(await HomePage());
    expect(screen.getByText("Ya tenés la sesión iniciada")).toBeTruthy();
    expect(view.container.querySelector("form")).toBeNull();
    const href = role === "candidate" ? "/dashboard" : role === "company" ? "/empresa" : "/account";
    expect(screen.getByRole("link", { name: label }).getAttribute("href")).toBe(href);
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(screen.getByLabelText("DNI")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^Ir al panel de / })).toBeNull();
    expect(view.container.querySelector('button[type="submit"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(screen.getByLabelText("CUIT")).toBeTruthy();
    expect(view.container.querySelector('button[type="submit"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByText("Ya tenés la sesión iniciada")).toBeTruthy();
    expect(view.container.querySelector("form")).toBeNull();
    expect(screen.getByRole("link", { name: label }).getAttribute("href")).toBe(href);
  });

  it("suppresses repeated empty-field explanations in all homepage access forms", async () => {
    const view = render(await HomePage());
    for (const mode of ["login", "candidate", "company"]) {
      if (mode === "candidate") fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
      if (mode === "company") fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
      fireEvent.submit(view.container.querySelector("form")!);
      expect(screen.queryByText("Completá este campo.")).toBeNull();
      expect(view.container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(mode === "login" ? 2 : mode === "candidate" ? 5 : 8);
      expect(screen.getByText(`Revisá los ${mode === "login" ? 2 : mode === "candidate" ? 5 : 8} campos indicados.`)).toBeTruthy();
    }
  });

  it("shows missing-only login markers and muted registration markers without duplication", async () => {
    const view = render(await HomePage());
    expect(view.container.querySelectorAll("[data-required-marker]")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(view.container.querySelectorAll('[data-marker-state="missing"]')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "test@example.invalid" } });
    expect(view.container.querySelectorAll('[data-marker-state="missing"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(view.container.querySelectorAll('[data-marker-state="muted"]')).toHaveLength(5);
    fireEvent.submit(view.container.querySelector("form")!);
    expect(view.container.querySelectorAll('[data-marker-state="missing"]')).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(view.container.querySelectorAll('[data-marker-state="muted"]')).toHaveLength(8);
    fireEvent.submit(view.container.querySelector("form")!);
    expect(view.container.querySelectorAll('[data-marker-state="missing"]')).toHaveLength(8);
    expect(screen.getByLabelText("Teléfono de contacto").closest("[data-form-field]")?.querySelector("[data-required-marker]")).toBeNull();
  });
  it("offers recovery below a separator after sign-in, outside the form and only in login mode", async () => {
    render(await HomePage());
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

  it("explains required asterisks below both registration forms but not login", async () => {
    render(await HomePage());
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

  it("orders company fields into the requested rows without requiring the optional phone", async () => {
    render(await HomePage());
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    const phone = screen.getByLabelText("Teléfono de contacto") as HTMLInputElement;
    const activity = screen.getByLabelText("Actividad") as HTMLInputElement;
    const locality = screen.getByLabelText("Localidad");
    const cuit = screen.getByLabelText("CUIT");
    const responsible = screen.getByLabelText("Persona responsable");
    const email = screen.getByLabelText("Correo electrónico");
    expect(responsible.closest("[data-form-field]")?.parentElement?.tagName).toBe("DIV");
    expect(responsible.closest("[data-form-field]")?.parentElement?.contains(email)).toBe(true);
    expect(responsible.closest("[data-form-field]")?.parentElement?.children).toHaveLength(2);
    const row = phone.closest("[data-form-field]")?.parentElement;
    expect(row?.tagName).toBe("DIV");
    expect(row?.contains(locality)).toBe(true);
    expect(row?.children).toHaveLength(2);
    expect(cuit.closest("[data-form-field]")?.parentElement?.contains(activity)).toBe(true);
    expect(cuit.closest("[data-form-field]")?.parentElement?.children).toHaveLength(2);
    expect([...phone.form!.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')].map(input => input.name)).toEqual([
      "legalName", "responsibleName", "email", "cuit", "activity", "locality", "phone", "password", "confirmation",
    ]);
    expect(phone.required).toBe(false);
    expect(activity.required).toBe(true);
    expect(screen.queryByText(/\(opcional\)/i)).toBeNull();
    expect(screen.getByRole("region", { name: "Acceso al portal" }).parentElement?.getAttribute("data-layout")).toBe("company");
  });

  it("removes the portal title while preserving the animated access card", async () => {
    render(await HomePage());
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

  it("preserves the shared password guidance across login, password change and registration", async () => {
    const help = "Entre 6 y 128 caracteres. No compartas tu contraseña.";
    const view = render(<AuthForm mode="login" />);
    expect(screen.getByText(help)).toBeTruthy();
    view.rerender(<AuthForm mode="password" />);
    expect(screen.getByText(help)).toBeTruthy();
    view.rerender(<CandidateRegistrationForm />);
    expect(screen.getByText(help)).toBeTruthy();
    view.rerender(<CompanyRegistrationForm />);
    expect(screen.getByText(help)).toBeTruthy();
  });

  it("shows the sign-in form by default", async () => {
    render(await HomePage());
    expect(screen.getByRole("button", { name: "Iniciar sesión" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Correo electrónico")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña", { exact: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ingresar" }).getAttribute("type")).toBe("submit");
    expect(screen.queryByRole("group", { name: "Tipo de cuenta" })).toBeNull();
  });

  it("switches between candidate and company registration and back to sign-in", async () => {
    render(await HomePage());
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

  it("preserves the original labels on existing authentication pages", async () => {
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
