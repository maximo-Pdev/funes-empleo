import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, SelectField, TextField } from "@/components/ui";

describe("municipal visual primitives", () => {
  it("shares the municipal control treatment without losing descriptions or validation", () => {
    render(<><TextField id="name" label="Nombre" hint="Ayuda" error="Revisá el nombre" required /><SelectField id="category" label="Categoría" options={[{ value: "example", label: "Ejemplo" }]} /></>);
    const input = screen.getByRole("textbox", { name: /Nombre/ });
    expect(input.classList.contains("municipal-control")).toBe(true);
    expect(screen.getByRole("combobox").classList.contains("municipal-control")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("name-hint name-error");
    expect((input as HTMLInputElement).required).toBe(true);
    expect(screen.getByRole("alert").textContent).toBe("Revisá el nombre");
  });

  it("uses municipal button colors while retaining destructive and busy behavior", () => {
    const onClick = vi.fn();
    render(<><Button>Guardar</Button><Button variant="danger">Archivar</Button><Button busy onClick={onClick}>Enviar</Button></>);
    expect(screen.getByRole("button", { name: "Guardar" }).classList.contains("bg-primary")).toBe(true);
    expect(screen.getByRole("button", { name: "Archivar" }).classList.contains("bg-red-800")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Procesando…" }));
    expect(onClick).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Procesando…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
