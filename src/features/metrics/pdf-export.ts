import "server-only";
import PDFDocument from "pdfkit";
import { join } from "node:path";
import { reportContext, reportRow, type MetricsReport } from "./report-data";

function printable(value: string) {
  // Keep line breaks; remove nonprinting control characters from free-text titles.
  return value.replace(/\p{Cc}/gu, character => "\n\r\t".includes(character) ? character : " ");
}
export function metricsPdf(report: MetricsReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 82, right: 42, bottom: 42, left: 42 }, bufferPages: true, info: { Title: "Métricas operativas", Author: "Oficina de Empleo de Funes" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      doc.registerFont("Regular", join(process.cwd(), "public/fonts/funes/be-vietnam-400.ttf"));
      doc.registerFont("Bold", join(process.cwd(), "public/fonts/funes/be-vietnam-700.ttf"));
      const width = doc.page.width - 84;
      for (const [label, value] of reportContext(report).slice(1)) {
        doc.font("Regular").fontSize(9).text(printable(`${label}: ${value}`), { width });
      }
      doc.moveDown();
      if (report.rows.length === 0) doc.text("No hay indicadores para los filtros seleccionados.");
      for (const row of report.rows) {
        const r = reportRow(row, report.references);
        const lines = [
          `${r.value === null ? "No calculable" : r.value.toLocaleString("es-AR", { maximumFractionDigits: 20 })} · ${r.unit} · ${r.state}`,
          r.category || r.categoryCode ? `Categoría: ${r.category} ${r.categoryCode}` : "",
          r.opening || r.openingCode ? `Oferta: ${r.opening} ${r.openingCode}` : "",
        ].filter(Boolean).map(printable);
        doc.font("Regular").fontSize(10);
        const height = doc.heightOfString(printable(r.indicator), { width }) + doc.heightOfString(lines.join("\n"), { width }) + 22;
        const remaining = doc.page.height - doc.page.margins.bottom - doc.y;
        if (height > remaining && doc.y > 130) doc.addPage();
        doc.font("Bold").fontSize(10).fillColor("#074A1F").text(printable(r.indicator), { width });
        doc.font("Regular").fontSize(10).fillColor("#262B35").text(lines.join("\n"), { width }).moveDown(0.8);
      }
      // Add headers after pagination, in reserved space, without moving body text.
      const pages = doc.bufferedPageRange();
      for (let page = pages.start; page < pages.start + pages.count; page++) {
        doc.switchToPage(page);
        doc.font("Bold").fontSize(15).fillColor("#074A1F").text("Métricas operativas", 42, 36, { width, lineBreak: false });
        doc.font("Regular").fontSize(9).fillColor("#262B35").text("Oficina de Empleo · Municipalidad de Funes", 42, 58, { width, lineBreak: false });
      }
      doc.end();
    } catch (error) { doc.destroy(); reject(error); }
  });
}
