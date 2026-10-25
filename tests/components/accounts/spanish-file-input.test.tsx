import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FileInput } from "@/components/forms/file-input";
import { Form } from "@/components/forms/form";

it("presenta selección española con el input real etiquetado y conserva el archivo ante rechazo", async () => {
  const submitted = vi.fn();
  const { container, rerender } = render(<Form onSubmit={event => { event.preventDefault(); submitted(); }}>
    <FileInput label="Archivo de prueba" name="cv" accept=".pdf" required /><button>Enviar</button>
  </Form>);
  const input = screen.getByLabelText("Archivo de prueba");
  expect(input).toHaveProperty("type", "file");
  expect(input).toHaveProperty("required", true);
  expect(screen.getByText("Seleccionar archivo")).toBeTruthy();
  expect(screen.getByText("Ningún archivo seleccionado")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(submitted).not.toHaveBeenCalled();
  const file = new File(["ficticio"], "cv-ficticio.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
  expect(screen.getByText("cv-ficticio.pdf")).toBeTruthy();
  rerender(<Form><FileInput label="Archivo de prueba" name="cv" accept=".pdf" required error="Carga rechazada" /><button>Enviar</button></Form>);
  expect(screen.getByText("cv-ficticio.pdf")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Carga rechazada");
  expect(container.querySelector('input[type="file"]')?.getAttribute("aria-invalid")).toBe("true");
  fireEvent.reset(container.querySelector("form")!);
  await waitFor(() => expect(screen.getByText("Ningún archivo seleccionado")).toBeTruthy());
});
