import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthForm } from "@/features/accounts/components/auth-form";

vi.mock("@/features/accounts/actions", () => ({
  loginAction: vi.fn(async () => ({ success: false, message: "No pudimos iniciar sesión. Revisá el correo, la contraseña y su verificación." })),
  recoveryAction: vi.fn(async () => ({ success: false, message: "No pudimos procesar la solicitud." })),
  passwordAction: vi.fn(),
  verificationAction: vi.fn(),
}));

it.each(["login", "recovery"] as const)("styles failed %s feedback without changing neutral initial feedback", async mode => {
  render(<AuthForm mode={mode} />);
  expect(screen.getByRole("status").classList.contains("text-red-700")).toBe(false);
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "persona@example.invalid" } });
  if (mode === "login") fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Ficticia-test-123" } });
  fireEvent.submit(screen.getByRole("button", { name: mode === "login" ? "Iniciar sesión" : "Solicitar enlace de recuperación" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("No pudimos"));
  expect(screen.getByRole("status").classList.contains("text-red-700")).toBe(mode === "login");
});
