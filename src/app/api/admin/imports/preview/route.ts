import { recordReference, routeIdentifier } from "@/lib/records/references";
import { NextResponse } from "next/server";
import { publicErrorFrom, AppError } from "@/lib/errors/public-error";
import { importSession, previewImport, readBoundedCsv } from "@/features/imports/preview-service";
import { requireImportOrigin } from "@/features/imports/request-origin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await importSession();
    requireImportOrigin(request);
    if (request.headers.get("x-fictional-data") !== "true") throw new AppError("ACCESS_DENIED");
    const retry = new URL(request.url).searchParams.get("retry");
    const id = await previewImport(await readBoundedCsv(request.body), retry ? await routeIdentifier("import", retry) : null);
    return NextResponse.json({ id, reference: await recordReference("import", id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: publicErrorFrom(error).message }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
