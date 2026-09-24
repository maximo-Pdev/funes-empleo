import { createHash } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = 1;
const forbiddenActions = /\/(?:JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b/i;

export type ValidatedPdf = { bytes: Uint8Array<ArrayBuffer>; safeName: string; sha256: string; size: number };

export function validatePdf(name: string, declaredMime: string, bytes: Uint8Array): ValidatedPdf | null {
  if (!/\.pdf$/i.test(name) || declaredMime !== "application/pdf" ||
    bytes.byteLength < MIN_BYTES || bytes.byteLength > MAX_BYTES) return null;
  const text = Buffer.from(bytes).toString("latin1");
  if (!/^%PDF-1\.[0-7]\r?\n/.test(text) || forbiddenActions.test(text)) return null;
  const eof = text.lastIndexOf("%%EOF");
  if (eof < 0 || text.slice(eof + 5).trim().length > 0) return null;
  const tail = text.slice(Math.max(0, eof - 80), eof);
  const start = /startxref\s+(\d+)\s*$/.exec(tail);
  if (!start) return null;
  const offset = Number(start[1]);
  if (!Number.isSafeInteger(offset) || offset < 9 || offset >= eof) return null;
  const crossReference = text.slice(offset, Math.min(offset + 256, eof));
  if (!/^(?:xref\s|\d+\s+\d+\s+obj\b)/.test(crossReference)) return null;
  if (!/\/Type\s*\/Page\b/.test(text) || !/\/Root\s+\d+\s+\d+\s+R/.test(text)) return null;
  const safeName = name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 200);
  if (!safeName) return null;
  return { bytes: new Uint8Array(bytes), safeName,
    sha256: createHash("sha256").update(bytes).digest("hex"), size: bytes.byteLength };
}
