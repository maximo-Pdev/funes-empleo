import "server-only";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors/public-error";
import { routeIdentifier } from "./references";
import { canonicalReferenceRoute } from "./reference-url";
import type { ReferenceKind } from "./reference-format";

export async function pageRecordIdentifier(kind: ReferenceKind, value: string, path: string, query: Record<string, string | string[] | undefined> = {}) {
  try {
    const id = await routeIdentifier(kind, value);
    await canonicalReferenceRoute(path, query);
    return id;
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function referenceFilters(path: string, query: Record<string, string | string[] | undefined>, fields: Record<string, ReferenceKind>) {
  const resolved = { ...query };
  for (const [key, kind] of Object.entries(fields)) {
    const value = query[key];
    if (typeof value !== "string" || !value) continue;
    try { resolved[key] = await routeIdentifier(kind, value); }
    catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") { resolved[key] = "invalid-reference"; continue; }
      throw error;
    }
  }
  if (!Object.values(resolved).includes("invalid-reference")) await canonicalReferenceRoute(path, query);
  return resolved;
}
