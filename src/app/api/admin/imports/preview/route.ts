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
    const id = await previewImport(await readBoundedCsv(request.body), new URL(request.url).searchParams.get("retry"));
    return NextResponse.json({ id }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: publicErrorFrom(error).message }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
