import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HomePage from "@/app/(public)/page";

it("identifica el entorno y la intermediación sin simular flujos implementados", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Portal Municipal de Empleo");
  expect(screen.getByText(/datos ficticios/)).toBeTruthy();
});
