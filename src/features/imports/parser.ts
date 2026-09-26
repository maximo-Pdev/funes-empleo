import { parse } from "csv-parse";
import { IMPORT_HEADERS, IMPORT_LIMITS } from "./mapping";
export type ImportPayload = { name: string; dni: string; email: string; phone: string; locality: string;
  categories: string[]; summary: string; availability: string; reference: string };

/** Bounded stream parser. Field errors are reported per row by the database, not silently dropped. */
export async function parseCandidateCsv(bytes: Uint8Array): Promise<ImportPayload[]> {
  try {
    if (!bytes.byteLength || bytes.byteLength > IMPORT_LIMITS.bytes) throw new Error();
    // Node Buffer decoding is permissive: explicitly reject malformed UTF-8 first.
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parser = parse({ bom: true, delimiter: ",", quote: '"', cast: false,
      relax_column_count: false, max_record_size: IMPORT_LIMITS.record,
      columns: (headers: string[]) => {
        if (headers.length !== IMPORT_HEADERS.length || headers.some((h, i) => h !== IMPORT_HEADERS[i])) throw new Error();
        return headers;
      } });
    parser.write(text);
    parser.end();
    const result: ImportPayload[] = [];
    for await (const record of parser) {
      if (result.length >= IMPORT_LIMITS.rows) throw new Error();
      const r = record as Record<typeof IMPORT_HEADERS[number], string>;
      const clean = (s: string) => s.normalize("NFC").trim();
      result.push({ name: clean(r.nombre), dni: clean(r.dni), email: clean(r.email).toLowerCase(),
        phone: clean(r.telefono), locality: clean(r.localidad), categories: r.categorias ? r.categorias.split("|").map(clean) : [],
        summary: clean(r.experiencia), availability: clean(r.disponibilidad), reference: clean(r.referencia) });
    }
    if (!result.length) throw new Error();
    return result;
  } catch {
    // csv-parse errors may include raw field values: never propagate them.
    throw new Error("INVALID_CSV");
  }
}
