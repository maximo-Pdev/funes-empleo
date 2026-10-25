import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui";

describe("badge de estado", () => {
  it("dibuja el punto de color y la etiqueta dentro de la misma píldora", () => {
    const { container } = render(<Badge variant="status" tone="green">Publicada</Badge>);
    const badge = screen.getByText("Publicada");
    const dot = badge.firstElementChild!;
    expect(badge.classList.contains("rounded-full")).toBe(true);
    expect(badge.classList.contains("gap-[7px]")).toBe(true);
    expect(dot.getAttribute("aria-hidden")).toBe("true");
    expect(dot.classList.contains("size-[7px]")).toBe(true);
    expect(dot.classList.contains("bg-current")).toBe(true);
  });

  it("aplica el color real en borde, texto y fondo tenue del tono recibido", () => {
    const { container } = render(<>
      <Badge variant="status" tone="green">Publicada</Badge>
      <Badge variant="status" tone="red">Rechazada</Badge>
      <Badge variant="status" tone="amber">En espera</Badge>
      <Badge variant="status" tone="blue">En revisión</Badge>
      <Badge variant="status" tone="violet">Derivada</Badge>
      <Badge variant="status" tone="neutral">Cerrada</Badge>
    </>);
    const expected = [
      ["text-status-green", "border-status-green", "bg-status-green-soft"],
      ["text-status-red", "border-status-red", "bg-status-red-soft"],
      ["text-status-amber", "border-status-amber", "bg-status-amber-soft"],
      ["text-status-blue", "border-status-blue", "bg-status-blue-soft"],
      ["text-status-violet", "border-status-violet", "bg-status-violet-soft"],
      ["text-status-neutral", "border-status-neutral", "bg-status-neutral-soft"],
    ];
    const badges = [...container.querySelectorAll("span.inline-flex")];
    expect(badges).toHaveLength(expected.length);
    badges.forEach((badge, index) => {
      const [text, border, surface] = expected[index]!;
      expect(badge.classList.contains(text!)).toBe(true);
      expect(badge.classList.contains(border!)).toBe(true);
      expect(badge.classList.contains(surface!)).toBe(true);
    });
  });

  it("usa el tono neutro cuando no se indica tono", () => {
    render(<Badge variant="status">Sin datos</Badge>);
    expect(screen.getByText("Sin datos").classList.contains("text-status-neutral")).toBe(true);
  });

  it("conserva las variantes existentes sin punto de estado", () => {
    const { container } = render(<>
      <Badge>Por defecto</Badge>
      <Badge variant="secondary">Secundario</Badge>
      <Badge variant="outline">Contorno</Badge>
    </>);
    expect(screen.getByText("Por defecto").classList.contains("bg-primary")).toBe(true);
    expect(screen.getByText("Secundario").classList.contains("bg-secondary")).toBe(true);
    expect(screen.getByText("Contorno").classList.contains("border-border")).toBe(true);
    for (const badge of container.querySelectorAll("span.inline-flex")) {
      expect(badge.querySelector("[aria-hidden]")).toBeNull();
      expect(badge.classList.contains("px-3")).toBe(true);
    }
  });
});
