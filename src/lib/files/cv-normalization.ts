import "server-only";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { join } from "node:path";
import { MAX_CV_BYTES } from "./cv-policy";
import { validatePdf, type ValidatedPdf } from "./pdf-validation";

export async function normalizeCv(name: string, mime: string, input: Uint8Array): Promise<ValidatedPdf | null> {
  if (!input.byteLength || input.byteLength > MAX_CV_BYTES) return null;
  if (/\.pdf$/i.test(name)) return validatePdf(name, mime, input);
  const jpeg = /\.jpe?g$/i.test(name) && mime === "image/jpeg";
  const png = /\.png$/i.test(name) && mime === "image/png";
  if (!jpeg && !png) return null;
  const signature = Buffer.from(input.subarray(0, 8));
  if (jpeg && !(signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff)) return null;
  if (png && !signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null;
  try {
    if (png) {
      const bytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
      for (let offset = 8; offset + 12 <= bytes.length;) {
        const length = bytes.readUInt32BE(offset);
        if (length > bytes.length - offset - 12 || bytes.toString("ascii", offset + 4, offset + 8) === "acTL") return null;
        offset += length + 12;
      }
    }
    const raster = sharp(input, { limitInputPixels: 16_000_000, animated: true, failOn: "warning" });
    const metadata = await raster.metadata();
    if (metadata.format !== (jpeg ? "jpeg" : "png") || (metadata.pages ?? 1) !== 1) return null;
    // Strip source metadata, orient, preserve all pixels and use a white page background.
    const { data, info } = await raster.rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 95 }).toBuffer({ resolveWithObject: true });
    const bytes = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ autoFirstPage: false, font: join(process.cwd(), "public/fonts/funes/be-vietnam-400.ttf") });
      const chunks: Buffer[] = []; let size = 0;
      doc.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_CV_BYTES) doc.destroy(new Error("CV_TOO_LARGE")); else chunks.push(chunk);
      });
      doc.on("error", reject); doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.addPage({ size: "A4", layout: info.width > info.height ? "landscape" : "portrait", margin: 0 });
      doc.image(data, 12, 12, { fit: [doc.page.width - 24, doc.page.height - 24], align: "center", valign: "center" });
      doc.end();
    });
    return validatePdf(name.replace(/\.[^.]+$/, ".pdf"), "application/pdf", bytes);
  } catch { return null; }
}
