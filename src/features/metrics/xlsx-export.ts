import "server-only";
import writeExcelFile, { type SheetData } from "write-excel-file/node";
import { reportContext, reportRow, type MetricsReport } from "./report-data";

const text = (value: string) => ({ type: String, value });
export async function metricsXlsx(report: MetricsReport): Promise<Buffer> {
  const headers = ["Indicador", "Valor", "Unidad", "Estado de cálculo", "Categoría", "Código categoría", "Oferta", "Código oferta"];
  const data: SheetData = [headers.map(value => ({ ...text(value), fontWeight: "bold", backgroundColor: "#074A1F", color: "#FFFFFF" })),
    ...report.rows.map(row => {
      const r = reportRow(row, report.references);
      return [text(r.indicator), r.value === null ? null : { type: Number, value: r.value }, text(r.unit), text(r.state),
        text(r.category), text(r.categoryCode), text(r.opening), text(r.openingCode)];
    })];
  return writeExcelFile([
    { sheet: "Contexto", data: reportContext(report).map(row => row.map(text)), columns: [{ width: 24 }, { width: 100 }] },
    { sheet: "Métricas", data, columns: [45, 18, 14, 22, 34, 34, 48, 34].map(width => ({ width })), stickyRowsCount: 1 },
  ], { fontFamily: "Calibri", fontSize: 11 }).toBuffer();
}
