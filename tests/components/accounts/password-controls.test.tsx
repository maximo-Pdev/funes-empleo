import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({
  loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(),
}));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));

import { AuthForm } from "@/features/accounts/components/auth-form";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

it.each([
  ["candidato", CandidateRegistrationForm], ["empresa", CompanyRegistrationForm],
] as const)("exige confirmar la contraseña en registro de %s", (_name, RegistrationForm) => {
  render(<RegistrationForm />);
  const confirmation = screen.getByLabelText("Confirmar contraseña");
  expect(confirmation).toHaveProperty("required", true);
  expect(confirmation).toHaveProperty("type", "password");
  expect(confirmation).toHaveProperty("minLength", 6);
  expect(confirmation).toHaveProperty("maxLength", 128);
  expect(confirmation).toHaveProperty("autocomplete", "new-password");
});

it.each([
  ["ingreso", <AuthForm key="login" mode="login" />, "current-password"],
  ["actualización", <AuthForm key="password" mode="password" />, "new-password"],
  ["candidato", <CandidateRegistrationForm key="candidate" />, "new-password"],
  ["empresa", <CompanyRegistrationForm key="company" />, "new-password"],
] as const)("permite mostrar y ocultar en %s sin perder el valor ni enviar el formulario", (_name, content, autocomplete) => {
  const view = render(content);
  const form = view.container.querySelector("form")!;
  const submit = vi.fn(event => event.preventDefault());
  form.addEventListener("submit", submit);
  const input = view.container.querySelector<HTMLInputElement>('input[name="password"]')!;
  expect(input.type).toBe("password");
  expect(input.autocomplete).toBe(autocomplete);
  fireEvent.change(input, { target: { value: "Fictitious-Only!" } });
  const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
  expect(toggle).toHaveProperty("type", "button");
  expect(toggle.getAttribute("aria-controls")).toBe(input.id);
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(toggle);
  expect(input.type).toBe("text");
  expect(screen.getByRole("button", { name: "Ocultar contraseña" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(toggle);
  expect(input.type).toBe("password");
  expect(input.value).toBe("Fictitious-Only!");
  expect(submit).not.toHaveBeenCalled();
});

it("controla por separado la visibilidad de la confirmación", () => {
  render(<CandidateRegistrationForm />);
  const password = screen.getByLabelText("Contraseña");
  const confirmation = screen.getByLabelText("Confirmar contraseña");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar confirmación de contraseña" }));
  expect(confirmation).toHaveProperty("type", "text");
  expect(password).toHaveProperty("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
  fireEvent.click(screen.getByRole("button", { name: "Ocultar confirmación de contraseña" }));
  expect(confirmation).toHaveProperty("type", "password");
  expect(password).toHaveProperty("type", "text");
});

it.each([
  ["candidato", CandidateRegistrationForm], ["empresa", CompanyRegistrationForm],
] as const)("valida coincidencia antes de enviar el registro de %s y se recupera al editar cualquier campo", (_name, RegistrationForm) => {
  render(<RegistrationForm />);
  const password = screen.getByLabelText<HTMLInputElement>("Contraseña");
  const confirmation = screen.getByLabelText<HTMLInputElement>("Confirmar contraseña");
  fireEvent.change(password, { target: { value: "Fictitious-First!" } });
  fireEvent.change(confirmation, { target: { value: "Fictitious-Second!" } });
  expect(confirmation.validity.customError).toBe(true);
  expect(confirmation.validationMessage).toMatch(/contraseñas.*coincidir/i);
  fireEvent.change(password, { target: { value: "Fictitious-Second!" } });
  expect(confirmation.checkValidity()).toBe(true);
  fireEvent.change(password, { target: { value: "Fictitious-First!" } });
  expect(confirmation.validity.customError).toBe(true);
  fireEvent.change(confirmation, { target: { value: "Fictitious-First!" } });
  expect(confirmation.checkValidity()).toBe(true);
});
