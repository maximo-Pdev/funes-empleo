import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PasswordField } from "@/features/accounts/components/password-field";
import { IdentifierField } from "@/components/forms/identifier-field";

it("uses one visibility-control treatment for passwords and masked identifiers", () => {
  render(<><PasswordField name="password" label="Contraseña" autoComplete="current-password" /><IdentifierField label="DNI" name="dni" defaultValue="90000001" /></>);
  const password = screen.getByRole("button", { name: "Mostrar contraseña" });
  const identifier = screen.getByRole("button", { name: "Mostrar DNI" });
  expect(password.getAttribute("data-slot")).toBe("input-visibility-toggle");
  expect(identifier.getAttribute("data-slot")).toBe("input-visibility-toggle");
  expect(password.className).toBe(identifier.className);
  expect(password.getAttribute("aria-controls")).toBe(screen.getByLabelText("Contraseña").id);
  expect(identifier.getAttribute("aria-controls")).toBe(screen.getByLabelText("DNI").id);
});
