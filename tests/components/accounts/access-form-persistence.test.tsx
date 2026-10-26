import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({
  loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(),
}));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));

import HomePage from "@/app/(public)/page";

afterEach(cleanup);

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const value = (label: string) => field(label).value;
const type = (label: string, text: string) => fireEvent.change(field(label), { target: { value: text } });

describe("Home access forms keep what was typed", () => {
  it("keeps login credentials out of registration fields", async () => {
    render(await HomePage());
    type("Correo electrónico", "ana@example.invalid");
    type("Contraseña", "secreto123");
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(value("Correo electrónico")).toBe("");
    expect(value("Contraseña")).toBe("");
    expect(value("Confirmar contraseña")).toBe("");
    expect(value("Nombre y apellido")).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(value("Correo electrónico")).toBe("ana@example.invalid");
    expect(value("Contraseña")).toBe("secreto123");
  });

  it("keeps registration credentials out of login", async () => {
    render(await HomePage());
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    type("Correo electrónico", "bruno@example.invalid");
    type("Contraseña", "register123");
    type("Confirmar contraseña", "different123");
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(value("Correo electrónico")).toBe("");
    expect(value("Contraseña")).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(value("Correo electrónico")).toBe("bruno@example.invalid");
    expect(value("Contraseña")).toBe("register123");
    expect(value("Confirmar contraseña")).toBe("different123");
  });

  it("keeps the registration fields when visiting the session tab and coming back", async () => {
    render(await HomePage());
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    type("Nombre y apellido", "Ana Pérez");
    type("DNI", "30123456");
    type("Correo electrónico", "ana@example.invalid");
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(value("Correo electrónico")).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(value("Nombre y apellido")).toBe("Ana Pérez");
    expect(value("DNI")).toBe("30123456");
    expect(value("Correo electrónico")).toBe("ana@example.invalid");
  });

  it("keeps independent credentials and other fields for both roles", async () => {
    render(await HomePage());
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    type("Nombre y apellido", "Ana Pérez");
    type("Correo electrónico", "ana@example.invalid");
    type("Contraseña", "candidate123");
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(value("Correo electrónico")).toBe("");
    expect(value("Contraseña")).toBe("");
    expect(value("Confirmar contraseña")).toBe("");
    expect(value("Nombre de la empresa")).toBe("");
    type("Nombre de la empresa", "Panadería Petrelli");
    type("Correo electrónico", "company@example.invalid");
    type("Contraseña", "company123");
    type("Confirmar contraseña", "company123");
    fireEvent.click(screen.getByRole("radio", { name: "Postulante" }));
    expect(value("Nombre y apellido")).toBe("Ana Pérez");
    expect(value("Correo electrónico")).toBe("ana@example.invalid");
    expect(value("Contraseña")).toBe("candidate123");
    expect(value("Confirmar contraseña")).toBe("");
    type("Correo electrónico", "");
    type("Contraseña", "");
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    expect(value("Nombre de la empresa")).toBe("Panadería Petrelli");
    expect(value("Correo electrónico")).toBe("company@example.invalid");
    expect(value("Contraseña")).toBe("company123");
    expect(value("Confirmar contraseña")).toBe("company123");
    fireEvent.click(screen.getByRole("radio", { name: "Postulante" }));
    expect(value("Correo electrónico")).toBe("");
    expect(value("Contraseña")).toBe("");
  });
});
