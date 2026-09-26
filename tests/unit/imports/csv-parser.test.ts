import { describe, expect, it } from "vitest";
import { parseCandidateCsv } from "@/features/imports/parser";
const header = "nombre,dni,email,telefono,localidad,categorias,experiencia,disponibilidad,referencia";
const row = "Persona ficticia,98001001,persona@example.invalid,,Funes,DEMO-A,Prueba,available,DEMO_1";
const parse = (text: string) => parseCandidateCsv(Buffer.from(text));
describe("contrato CSV de demostración", () => {
  it("acepta BOM, CRLF y conserva DNI como texto", async () => {
    const rows = await parse(`\ufeff${header}\r\n${row}`);
    expect(rows[0]?.dni).toBe("98001001");
    expect(rows[0]?.categories).toEqual(["DEMO-A"]);
  });
  it.each(["", header, header.replace("nombre", "otro") + "\n" + row,
    header.replace("email", "dni") + "\n" + row, `${header}\n${row},extra`,
  ])("rechaza estructura inválida %s", async (text) => {
    await expect(parse(text)).rejects.toThrow("INVALID_CSV");
  });
  it("acepta newline final sin agregar registros", async () => {
    expect(await parse(`${header}\n${row}\n`)).toHaveLength(1);
  });
  it("no descarta filas inválidas: las preserva para el diagnóstico", async () => {
    const rows = await parse(`${header}\n${row.replace("98001001", "no-es-dni")}`);
    expect(rows[0]?.dni).toBe("no-es-dni");
  });
  it("rechaza UTF-8 inválido y más de 5 MiB", async () => {
    await expect(parseCandidateCsv(Buffer.from([0xff, 0xfe]))).rejects.toThrow("INVALID_CSV");
    await expect(parseCandidateCsv(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow("INVALID_CSV");
  });
  it("rechaza registros mayores a 64 KiB y más de 10.000 filas", async () => {
    await expect(parse(`${header}\n${"a".repeat(65537)}`)).rejects.toThrow("INVALID_CSV");
    await expect(parse(`${header}\n${Array(10001).fill(row).join("\n")}`)).rejects.toThrow("INVALID_CSV");
  });
  it("no infiere ni convierte valores", async () => {
    const rows = await parse(`${header}\n${row.replace("98001001", "00123456")}`);
    expect(rows[0]?.dni).toBe("00123456");
  });
});
