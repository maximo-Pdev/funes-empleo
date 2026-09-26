"use server";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { resolveImport } from "./preview-service";
export async function resolveImportAction(input: unknown) {
  try { return { ok: true as const, preview: await resolveImport(input) }; }
  catch (error) { return { ok: false as const, error: publicErrorFrom(error).message }; }
}
