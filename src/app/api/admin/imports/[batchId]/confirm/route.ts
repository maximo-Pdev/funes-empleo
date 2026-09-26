import { NextResponse } from "next/server";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { confirmImport, importSession, readBoundedCsv } from "@/features/imports/preview-service";
import { requireImportOrigin } from "@/features/imports/request-origin";
export async function POST(request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    await importSession();
    requireImportOrigin(request);
    const text = (await readBoundedCsv(request.body, 1024)).toString("utf8");
    const { batchId } = await context.params;
    return NextResponse.json({ preview: await confirmImport(batchId, JSON.parse(text)) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: publicErrorFrom(error).message }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
