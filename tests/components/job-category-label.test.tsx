import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CategoryLabel, CategoryLabels } from "@/components/job-category-label";

it("renders category lists with original comma separators and an explicit empty fallback", () => {
  const { container, rerender } = render(<CategoryLabels categories={[{ name: "Agro" }, { name: "Tecnología" }]} fallback="Sin categorías" />);
  expect(container.textContent).toBe("Agro, Tecnología");
  expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(2);
  rerender(<CategoryLabels categories={[]} fallback="Sin categorías" />);
  expect(container.textContent).toBe("Sin categorías");
  expect(container.querySelector("svg")).toBeNull();
});

const catalog = [
  ["ADMINISTRACION", "Administración", "clipboard-list"],
  ["ATENCION_VENTAS", "Atención al cliente y ventas", "headset"],
  ["COMERCIO", "Comercio", "store"],
  ["GASTRONOMIA_HOTELERIA", "Gastronomía y hotelería", "utensils"],
  ["LIMPIEZA", "Limpieza", "brush-cleaning"],
  ["CONSTRUCCION_OFICIOS", "Construcción y oficios", "hard-hat"],
  ["MANTENIMIENTO", "Mantenimiento", "wrench"],
  ["PRODUCCION_INDUSTRIA", "Producción e industria", "factory"],
  ["LOGISTICA_DEPOSITO", "Logística y depósito", "warehouse"],
  ["TRANSPORTE_REPARTO", "Transporte y reparto", "truck"],
  ["SALUD_CUIDADOS", "Salud y cuidados", "heart-pulse"],
  ["EDUCACION", "Educación", "graduation-cap"],
  ["TECNOLOGIA", "Tecnología", "monitor"],
  ["SEGURIDAD", "Seguridad", "shield-check"],
  ["AGRO", "Agro", "wheat"],
];

it.each(catalog)("resolves %s by exact catalog code and public name", (code, name, icon) => {
  const { container, rerender } = render(<CategoryLabel code={code} name={name!} />);
  expect(container.querySelector(`svg.lucide-${icon}`)).not.toBeNull();
  rerender(<CategoryLabel name={name!} />);
  expect(container.querySelector(`svg.lucide-${icon}`)).not.toBeNull();
  expect(container.textContent).toBe(name);
});

it.each(["Categoría ficticia A", "DEMO-B", "Agroindustrial desconocido", "Tecnología alimentaria", "toString", "__proto__"])("uses a neutral fallback for unknown %s without guessing", name => {
  const { container } = render(<CategoryLabel code="DEMO-A" name={name} />);
  expect(container.querySelector("svg.lucide-briefcase-business")).not.toBeNull();
  expect(container.textContent).toBe(name);
});

it("prefers a known code without replacing the supplied display name", () => {
  const { container } = render(<CategoryLabel code="AGRO" name="Nombre conservado" />);
  expect(container.querySelector("svg.lucide-wheat")).not.toBeNull();
  expect(container.textContent).toBe("Nombre conservado");
});

it("keeps category text alongside a decorative food icon", () => {
  const { container } = render(<CategoryLabel name="Gastronomía y hotelería" className="custom-label" />);
  expect(screen.getByText("Gastronomía y hotelería")).toBeTruthy();
  const icon = container.querySelector("svg.lucide-utensils")!;
  expect(icon).not.toBeNull();
  expect(icon.getAttribute("aria-hidden")).toBe("true");
  expect(screen.queryByRole("img")).toBeNull();
  expect(container.firstElementChild?.className).toContain("inline-flex");
  expect(container.firstElementChild?.className).toContain("min-w-0");
  expect(container.firstElementChild?.className).toContain("gap-1.5");
  expect(container.firstElementChild?.className).toContain("custom-label");
});
