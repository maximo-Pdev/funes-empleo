import { expect, it, vi } from "vitest";
import { readAllRows } from "@/lib/collections/read-all";
import { collectionPage } from "@/lib/collections/limits";

it("recorre lotes ordenados y conserva también los registros más allá del límite API", async () => {
  const rows = Array.from({ length: 1051 }, (_, id) => ({ id }));
  const query = vi.fn(async (from: number, to: number) => ({ data: rows.slice(from, to + 1), error: null }));
  expect((await readAllRows(query)).data).toEqual(rows);
  expect(query).toHaveBeenCalledTimes(6);
  expect(query).toHaveBeenLastCalledWith(1000, 1199);
});

it("propaga un fallo posterior en lugar de presentar una colección incompleta", async () => {
  const query = vi.fn().mockResolvedValueOnce({ data: Array(200).fill({ id: 1 }), error: null })
    .mockResolvedValueOnce({ data: null, error: { code: "ACCESS_DENIED" } });
  const result = await readAllRows(query);
  expect(result.data).toEqual([]);
  expect(result.error).toEqual({ code: "ACCESS_DENIED" });
});

it("valida índices externos sin aceptar arrays, negativos ni saltos ilimitados", () => {
  expect(collectionPage("12")).toBe(12);
  for (const value of [undefined, ["2"], "0", "-2", "1.5", "Infinity", "1000000000000"]) expect(collectionPage(value)).toBe(1);
});
