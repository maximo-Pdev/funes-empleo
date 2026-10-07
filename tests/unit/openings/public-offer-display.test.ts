import { expect, it } from "vitest";
import { formatPublicClosingDate, publicContractTypeLabel, publicModalityLabel } from "@/features/openings/public-offer-display";

it("traduce únicamente los códigos legacy observados", () => {
  expect(publicModalityLabel("onsite")).toBe("Presencial");
  expect(publicContractTypeLabel("fixed_term")).toBe("Plazo fijo");
});

it.each(["", "remote", "presencial", "tiempo_indeterminado", "ONSITE", " onsite ", "toString", "__proto__", "Texto municipal sin normalizar"])("conserva valores desconocidos verbatim: %s", (value) => {
  expect(publicModalityLabel(value)).toBe(value);
  expect(publicContractTypeLabel(value)).toBe(value);
});

it.each([
  ["2099-12-31", "31/12/2099"],
  ["2024-02-29", "29/02/2024"],
  ["2000-02-29", "29/02/2000"],
  ["2026-01-01", "01/01/2026"],
  ["0001-01-01", "01/01/0001"],
])("formatea fechas calendario válidas sin desplazar el día: %s", (input, expected) => {
  expect(formatPublicClosingDate(input)).toBe(expected);
});

it.each([
  "", "2023-02-29", "1900-02-29", "2100-02-29", "2024-02-30", "2026-04-31",
  "2026-00-10", "2026-13-10", "2026-01-00", "2026-01-32", "0000-01-01",
  "2026-1-01", "26-01-01", "2026-01-01T00:00:00Z", "2026-01-01\n",
  " 2026-01-01", "2026-01-01 ", "31/12/2099", "fecha desconocida",
])("conserva fechas inválidas o no estrictas: %s", (input) => {
  expect(formatPublicClosingDate(input)).toBe(input);
});
