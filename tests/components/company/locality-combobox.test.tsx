import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Form } from "@/components/forms/form";
import { LocalityCombobox } from "@/features/companies/components/locality-combobox";

async function choose(locality: string) {
  fireEvent.click(screen.getByRole("combobox", { name: "Localidad" }));
  fireEvent.click(await screen.findByRole("option", { name: locality }));
}

describe("Localidad en formularios", () => {
  it("mantiene el valor inicial y notifica cambios sin necesitar un controlador", async () => {
    const onChange = vi.fn();
    const { container } = render(<Form><LocalityCombobox label="Localidad" name="locality" defaultValue="Funes" onChange={onChange} /></Form>);
    const form = container.querySelector("form")!;
    expect(new FormData(form).getAll("locality")).toEqual(["Funes"]);
    await choose("Rosario");
    await waitFor(() => expect(new FormData(form).getAll("locality")).toEqual(["Rosario"]));
    expect(onChange).toHaveBeenCalledWith("Rosario");
  });

  it("no exige una localidad opcional ni el filtro controlado sin nombre", () => {
    const submit = vi.fn(event => event.preventDefault());
    const { container } = render(<Form onSubmit={submit}>
      <LocalityCombobox name="locality" required={false} />
      <LocalityCombobox value="" onChange={vi.fn()} aria-label="Filtro de localidad" />
      <button type="submit">Buscar</button>
    </Form>);
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(new FormData(container.querySelector("form")!).getAll("locality")).toEqual([""]);
  });

  it("sincroniza cambios y vaciado controlados con validación y datos enviados", async () => {
    function Controlled() {
      const [value, setValue] = useState("Funes");
      return <Form><LocalityCombobox label="Localidad" name="locality" value={value} onChange={next => setValue(next ?? "")} />
        <button type="button" onClick={() => setValue("")}>Limpiar filtro</button><button type="submit">Guardar</button>
      </Form>;
    }
    const { container } = render(<Controlled />);
    const form = container.querySelector("form")!;
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtro" }));
    expect(new FormData(form).getAll("locality")).toEqual([""]);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const trigger = screen.getByRole("combobox", { name: "Localidad" });
    expect(document.activeElement).toBe(trigger);
    const error = screen.getByText("Completá este campo.");
    expect(trigger.getAttribute("aria-describedby")).toBe(error.id);
    await choose("Funes");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(trigger.hasAttribute("aria-describedby")).toBe(false);
    expect(new FormData(form).getAll("locality")).toEqual(["Funes"]);
  });
});
