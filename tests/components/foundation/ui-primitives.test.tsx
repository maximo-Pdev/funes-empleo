import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorBoundary from "@/app/error";
import { RoleShell } from "@/components/layouts";
import { Button, EmptyState, FeedbackMessage, LoadingState, SelectField, TextField } from "@/components/ui";

describe("primitivos accesibles", () => {
  it("asocia etiquetas, ayuda y error al campo sin depender del color", () => {
    render(<TextField id="correo" label="Correo electrónico" hint="Usá un correo al que tengas acceso." error="Ingresá un correo válido." required />);
    const input = screen.getByRole("textbox", { name: /Correo electrónico/ });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("correo-hint correo-error");
    expect(screen.getByRole("alert").textContent).toMatch(/correo válido/);
  });

  it("ofrece un selector etiquetado y bloquea el envío mientras procesa", () => {
    const onClick = vi.fn();
    render(<><SelectField id="categoria" label="Categoría" options={[{ value: "ficticia", label: "Categoría ficticia" }]} /><Button busy onClick={onClick}>Guardar</Button></>);
    expect(screen.getByRole("combobox", { name: "Categoría" })).toBeTruthy();
    const button = screen.getByRole("button", { name: "Procesando…" });
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("distingue aviso, carga y estado vacío con mensajes en español", () => {
    render(<><FeedbackMessage tone="error">Revisá los datos.</FeedbackMessage><LoadingState /><EmptyState title="Sin resultados" description="No hubo resultados para estos filtros." /></>);
    expect(screen.getByRole("alert").textContent).toMatch(/Revisá/);
    expect(screen.getByRole("status").textContent).toMatch(/Cargando/);
    expect(screen.getByRole("heading", { name: "Sin resultados" })).toBeTruthy();
  });
});

describe("layout por rol", () => {
  it("ofrece navegación y contenido principal sin fingir una autorización", () => {
    render(<RoleShell role="admin" title="Panel de prueba" navigation={[{ href: "/admin", label: "Inicio" }]}><p>Datos ficticios</p></RoleShell>);
    expect(screen.getByRole("navigation", { name: /Oficina de Empleo/ })).toBeTruthy();
    expect(screen.getByRole("main").id).toBe("contenido");
    expect(screen.getByRole("heading", { level: 1, name: "Panel de prueba" })).toBeTruthy();
  });
});

describe("límite de error", () => {
  it("no revela el mensaje técnico y permite reintentar con teclado o clic", () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("DNI-FICTICIO; token-secreto")} reset={reset} />);
    expect(screen.getByRole("alert").textContent).toMatch(/No pudimos completar/);
    expect(screen.getByRole("alert").textContent).not.toContain("token-secreto");
    fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
