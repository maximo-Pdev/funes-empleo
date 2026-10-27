import { metricsDownload } from "@/features/metrics/download-route";
import { metricsPdf } from "@/features/metrics/pdf-export";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = metricsDownload(metricsPdf, "application/pdf", "metricas.pdf");
