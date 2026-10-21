import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn() }));
import Login from "@/app/(auth)/login/page";

it("ubica registro, información y login en la misma grilla, con registro antes del formulario", () => {
  const view = render(<Login />);
  const signup = screen.getByRole("heading", { name: "¿Todavía no tenés cuenta?" });
  const login = screen.getByRole("heading", { name: "Iniciar sesión", level: 1 });
  expect(signup.compareDocumentPosition(login) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const cards = view.container.querySelectorAll("[data-login-card]");
  const signupSection = view.container.querySelector("[data-login-signup]");
  expect(cards).toHaveLength(2);
  expect(signupSection).toBeTruthy();
  expect(signupSection!.parentElement).toBe(cards[0]!.parentElement);
  expect(signupSection!.parentElement).toBe(cards[1]!.parentElement);
});

it("conserva credenciales y todos los destinos de registro, verificación y recuperación", () => {
  render(<Login />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByLabelText("Correo electrónico")).toHaveProperty("required", true);
  expect(screen.getByLabelText("Contraseña", { exact: true })).toHaveProperty("type", "password");
  expect(screen.queryByLabelText("Confirmar contraseña")).toBeNull();
  const signup = within(screen.getByRole("navigation", { name: "Crear una cuenta" }));
  expect(signup.getByRole("link", { name: "Soy postulante" }).getAttribute("href")).toBe("/registro/candidato");
  expect(signup.getByRole("link", { name: "Soy empresa" }).getAttribute("href")).toBe("/registro/empresa");
  expect(screen.getByRole("link", { name: "Recuperar acceso" }).getAttribute("href")).toBe("/recover");
  expect(screen.getByRole("link", { name: "Necesito verificar mi correo" }).getAttribute("href")).toBe("/verification-pending");
});

it("mantiene la intermediación municipal y el aviso de cuenta individual verificada", () => {
  render(<Login />);
  expect(screen.getByText(/La Oficina de Empleo evalúa las postulaciones/)).toBeTruthy();
  expect(screen.getByText("Usá tu cuenta individual y tu correo verificado.")).toBeTruthy();
});
