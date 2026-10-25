import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useActionState } from "react";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";

it("summarizes missing text fields without losing invalid state, hints or focus", () => {
  const submit = vi.fn(event => event.preventDefault());
  const view = render(<Form missingFieldMessages="summary" onSubmit={submit}>
    <Field hint="Nombre completo">Nombre<input required /></Field>
    <Field>Correo<input type="email" required /></Field><button>Guardar</button>
  </Form>);
  fireEvent.submit(view.container.querySelector("form")!);
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByText("Completá este campo.")).toBeNull();
  expect(screen.getByRole("alert").textContent).toBe("Revisá los 2 campos indicados.");
  const name = screen.getByLabelText("Nombre");
  expect(name.getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement).toBe(name);
  expect(name.getAttribute("aria-describedby")).toBe(`${name.id}-hint`);
  expect(screen.getByLabelText("Correo").hasAttribute("aria-describedby")).toBe(false);
  fireEvent.change(name, { target: { value: "Persona ficticia" } });
  expect(name.getAttribute("aria-invalid")).not.toBe("true");
  expect(screen.getByRole("alert").textContent).toBe("Revisá el campo indicado.");
});

it("keeps format and confirmation explanations alongside a quiet missing field", () => {
  const view = render(<Form missingFieldMessages="summary">
    <Field>Nombre<input required /></Field><Field>Correo<input type="email" required /></Field>
    <Field>Contraseña<input name="password" defaultValue="Fictitious-only" /></Field>
    <Field>Confirmación<input name="confirmation" defaultValue="Different-value" /></Field>
  </Form>);
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "invalid-email" } });
  fireEvent.submit(view.container.querySelector("form")!);
  expect(screen.queryByText("Completá este campo.")).toBeNull();
  expect(screen.getByText(/Ingresá un correo válido/)).toBeTruthy();
  expect(screen.getByText("Las contraseñas deben coincidir.")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Revisá los 3 campos indicados.");
  for (const label of ["Correo", "Confirmación"]) {
    const control = screen.getByLabelText(label);
    expect(document.getElementById(control.getAttribute("aria-describedby")!)).not.toBeNull();
  }
});

it("preserves supplied server errors in summary-only missing presentation", () => {
  const view = render(<Form missingFieldMessages="summary"><Field error="No se pudo guardar este dato.">Nombre<input required /></Field></Form>);
  fireEvent.submit(view.container.querySelector("form")!);
  expect(screen.getByText("No se pudo guardar este dato.")).toBeTruthy();
  const control = screen.getByLabelText("Nombre");
  expect(document.getElementById(control.getAttribute("aria-describedby")!)?.textContent).toBe("No se pudo guardar este dato.");
});

it.each(["on-missing", "muted"] as const)("uses one %s marker only for missing required values after submit", policy => {
  const view = render(<Form requiredMarkers={policy}><Field>Correo<input required type="email" /></Field><Field>Opcional<input /></Field></Form>);
  const marker = () => view.container.querySelectorAll("[data-required-marker]");
  expect(marker()).toHaveLength(policy === "muted" ? 1 : 0);
  if (policy === "muted") expect(marker()[0]?.getAttribute("data-marker-state")).toBe("muted");
  fireEvent.submit(view.container.querySelector("form")!);
  expect(marker()).toHaveLength(1);
  expect(marker()[0]?.getAttribute("data-marker-state")).toBe("missing");
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "not-an-email" } });
  expect(screen.getByLabelText("Correo").getAttribute("aria-invalid")).toBe("true");
  expect(marker()).toHaveLength(policy === "muted" ? 1 : 0);
  if (policy === "muted") expect(marker()[0]?.getAttribute("data-marker-state")).toBe("muted");
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: " " } });
  expect(marker()[0]?.getAttribute("data-marker-state")).toBe("missing");
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "test@example.invalid" } });
  expect(screen.queryByRole("alert")).toBeNull();
});

it("marca solo obligatorios con asterisco y conserva el nombre accesible", () => {
  render(<Form><Field>Nombre<input required /></Field><Field>Referencia<input /></Field></Form>);
  expect(screen.getByLabelText("Nombre")).toHaveProperty("required", true);
  expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true");
});

it("muestra errores por campo, descripción y foco sin llamar al envío", () => {
  const submit = vi.fn(event => event.preventDefault());
  const view = render(<Form onSubmit={submit}><Field>Nombre<input required /></Field><Field>Correo<input type="email" required /></Field><button>Guardar</button></Form>);
  fireEvent.submit(view.container.querySelector("form")!);
  expect(submit).not.toHaveBeenCalled();
  const name = screen.getByLabelText("Nombre");
  expect(name.getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement).toBe(name);
  expect(screen.getAllByText("Completá este campo.")).toHaveLength(2);
  expect(document.getElementById(name.getAttribute("aria-describedby")!)?.textContent).toContain("Completá este campo.");
  expect(screen.getByRole("alert").textContent).toBe("Revisá los 2 campos indicados.");
});

it("actualiza error al corregir, valida correo y no borra lo cargado", () => {
  const view = render(<Form><Field>Nombre<input required /></Field><Field>Correo<input required type="email" /></Field></Form>);
  const name = screen.getByLabelText("Nombre");
  const email = screen.getByLabelText("Correo");
  fireEvent.change(name, { target: { value: "Persona ficticia" } });
  fireEvent.change(email, { target: { value: "correo-inválido" } });
  fireEvent.submit(view.container.querySelector("form")!);
  expect(screen.getByText(/Ingresá un correo válido/)).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Revisá el campo indicado.");
  expect(name).toHaveProperty("value", "Persona ficticia");
  fireEvent.change(email, { target: { value: "persona@example.invalid" } });
  expect(email.getAttribute("aria-invalid")).not.toBe("true");
});

it("impide el reset automático de una Action con resultado fallido", () => {
  const view = render(<Form action={async () => {}} result={{ success: false }}><Field>Nombre<input defaultValue="Anterior" /></Field></Form>);
  const name = screen.getByLabelText("Nombre");
  fireEvent.change(name, { target: { value: "Corrección ficticia" } });
  view.container.querySelector("form")!.reset();
  expect(name).toHaveProperty("value", "Corrección ficticia");
});

it("una Action real fallida conserva texto, selección, contraseña y archivo", async () => {
  function Fixture() {
    const [result, action] = useActionState(async () => ({ success: false, message: "Revisá los datos." }), { success: false, message: "" });
    return <Form action={action} result={result}>
      <Field>Nombre<input name="name" defaultValue="Anterior" /></Field>
      <Field>Clave<input name="password" type="password" /></Field>
      <Field>Opciones<select name="option" defaultValue="a"><option value="a">A</option><option value="b">B</option></select></Field>
      <Field>Confirmación<input type="checkbox" name="confirmed" /></Field>
      <Field>Archivo<input type="file" name="file" /></Field>
      <p>{result.message}</p><button>Guardar</button>
    </Form>;
  }
  render(<Fixture />);
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Corrección ficticia" } });
  fireEvent.change(screen.getByLabelText("Clave"), { target: { value: "Clave ficticia" } });
  fireEvent.change(screen.getByLabelText("Opciones"), { target: { value: "b" } });
  fireEvent.click(screen.getByLabelText("Confirmación"));
  const file = new File(["ficticio"], "ficticio.txt");
  fireEvent.change(screen.getByLabelText("Archivo"), { target: { files: [file] } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await screen.findByText("Revisá los datos.");
  expect(screen.getByLabelText("Nombre")).toHaveProperty("value", "Corrección ficticia");
  expect(screen.getByLabelText("Clave")).toHaveProperty("value", "Clave ficticia");
  expect(screen.getByLabelText("Opciones")).toHaveProperty("value", "b");
  expect(screen.getByLabelText("Confirmación")).toHaveProperty("checked", true);
  expect((screen.getByLabelText("Archivo") as HTMLInputElement).files?.[0]).toBe(file);
});

it("solo limpia luego de un éxito explícito, salvo confirmaciones públicas no enumerables", () => {
  const view = render(<Form result={{ success: false }}><Field>Nombre<input defaultValue="Anterior" /></Field></Form>);
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Cambio" } });
  view.rerender(<Form result={{ success: true }}><Field>Nombre<input defaultValue="Anterior" /></Field></Form>);
  expect(screen.getByLabelText("Nombre")).toHaveProperty("value", "Anterior");
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Se conserva" } });
  view.rerender(<Form result={{ success: true }} preserveOnSuccess><Field>Nombre<input defaultValue="Anterior" /></Field></Form>);
  expect(screen.getByLabelText("Nombre")).toHaveProperty("value", "Se conserva");
});

it("excluye ocultos, deshabilitados y campos opcionales vacíos", () => {
  const submit = vi.fn(event => event.preventDefault());
  const view = render(<Form onSubmit={submit}><input type="hidden" name="version" value="1" /><Field>Oculto<input required disabled /></Field>
    <Field>Opcional<input minLength={6} /></Field><Field>Solo lectura<input required readOnly /></Field></Form>);
  fireEvent.submit(view.container.querySelector("form")!);
  expect(submit).toHaveBeenCalledOnce();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("valida grupos alternativos sin exigir ambos contactos ni marcar todos los checks", () => {
  const view = render(<Form requirements={[{ names: ["email", "phone"], message: "Ingresá un contacto." }]}>
    <Field>Correo<input type="email" name="email" /></Field><Field>Teléfono<input type="tel" name="phone" /></Field>
  </Form>);
  fireEvent.submit(view.container.querySelector("form")!);
  expect(screen.getAllByText("Ingresá un contacto.")).toHaveLength(3);
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "3415550100" } });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByLabelText("Correo").getAttribute("aria-invalid")).not.toBe("true");
});

it("comprueba longitud, formato, rango y confirmación de contraseña", () => {
  const view = render(<Form><Field>Nombre<input minLength={2} /></Field>
    <Field>Código<input pattern="[0-9]+" title="Usá solo números." /></Field>
    <Field>Vacantes<input type="number" min={1} max={10} /></Field>
    <Field>Contraseña<input name="password" /></Field><Field>Repetición<input name="confirmation" /></Field></Form>);
  for (const [label, value] of [["Nombre", "A"], ["Código", "ABC"], ["Vacantes", "11"], ["Contraseña", "primera"], ["Repetición", "segunda"]] as const) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.submit(view.container.querySelector("form")!);
  expect(screen.getByText("Ingresá al menos 2 caracteres.")).toBeTruthy();
  expect(screen.getByText("Usá solo números.")).toBeTruthy();
  expect(screen.getByText("Ingresá un valor menor o igual a 10.")).toBeTruthy();
  expect(screen.getByText("Las contraseñas deben coincidir.")).toBeTruthy();
});

it("rechaza archivos vacíos, demasiado grandes y de otro formato sin borrarlos", () => {
  const submit = vi.fn();
  const view = render(<Form onSubmit={submit}><Field>PDF<input type="file" accept=".pdf,application/pdf" required data-max-bytes={10} /></Field></Form>);
  const input = screen.getByLabelText("PDF") as HTMLInputElement;
  for (const file of [new File([], "vacío.pdf", { type: "application/pdf" }), new File(["más de diez bytes"], "grande.pdf", { type: "application/pdf" }), new File(["texto"], "texto.txt", { type: "text/plain" })]) {
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.submit(view.container.querySelector("form")!);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.files?.[0]).toBe(file);
  }
  expect(submit).not.toHaveBeenCalled();
});

it("conserva mensajes y datos de un formulario al enviar otro", async () => {
  render(<><Form><Field>Nombre<input required /></Field><button>Primero</button></Form>
    <Form><Field>Nombre<input required /></Field><button>Segundo</button></Form></>);
  const inputs = screen.getAllByLabelText("Nombre");
  const first = inputs[0]!;
  const second = inputs[1]!;
  expect(first.id).not.toBe(second.id);
  fireEvent.change(second, { target: { value: "Dato ficticio" } });
  fireEvent.click(screen.getByRole("button", { name: "Primero" }));
  expect(first.getAttribute("aria-invalid")).toBe("true");
  await waitFor(() => expect(second.getAttribute("aria-invalid")).not.toBe("true"));
  expect(second).toHaveProperty("value", "Dato ficticio");
});

it("señala un rango de fechas invertido sin navegar ni vaciar filtros", () => {
  const submit = vi.fn(event => event.preventDefault());
  const view = render(<Form onSubmit={submit} requirements={[{ names: ["from", "to"], rule: "date-order", message: "Ordená las fechas." }]}>
    <Field>Desde<input name="from" type="date" defaultValue="2026-10-15" required /></Field>
    <Field>Hasta<input name="to" type="date" defaultValue="2026-10-01" required /></Field>
  </Form>);
  fireEvent.submit(view.container.querySelector("form")!);
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Hasta").getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByLabelText("Desde")).toHaveProperty("value", "2026-10-15");
  fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-10-16" } });
  fireEvent.submit(view.container.querySelector("form")!);
  expect(submit).toHaveBeenCalledOnce();
});
