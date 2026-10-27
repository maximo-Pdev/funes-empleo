import { metricsDownload } from "@/features/metrics/download-route";
import { metricsXlsx } from "@/features/metrics/xlsx-export";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = metricsDownload(metricsXlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "metricas.xlsx");
