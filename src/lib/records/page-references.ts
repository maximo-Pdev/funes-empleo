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
    if (value === undefined || value === null) continue;
    const list = Array.isArray(value) ? value : [value];
    try {
      const ids = await Promise.all(list.map(item => routeIdentifier(kind, item)));
      resolved[key] = Array.isArray(value) ? ids : ids[0];
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") { resolved[key] = "invalid-reference"; continue; }
      throw error;
    }
  }
  const hasInvalid = Object.values(resolved).some(value =>
    value === "invalid-reference" || (Array.isArray(value) && value.includes("invalid-reference")));
  if (!hasInvalid) await canonicalReferenceRoute(path, query);
  return resolved;
}
