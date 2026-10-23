import "server-only";
import { redirect } from "next/navigation";
import { recordReference } from "./references";
import { databaseIdentifierPattern, type ReferenceKind } from "./reference-format";

const routeRules: readonly [RegExp, ReferenceKind][] = [
  [/^(\/admin\/candidates\/(?:assisted\/)?)([^/]+)$/, "candidate"],
  [/^(\/admin\/empresas\/)([^/]+)$/, "company"],
  [/^(\/(?:admin\/openings|empresa\/ofertas|company\/openings)\/)([^/]+)(\/referrals)?$/, "opening"],
  [/^(\/admin\/participations\/)([^/]+)$/, "participation"],
  [/^(\/(?:admin\/imports|api\/admin\/imports)\/)([^/]+)(\/confirm)?$/, "import"],
  [/^(\/api\/cv\/)([^/]+)$/, "cv"],
];

export async function referenceUrl(href: string): Promise<string> {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "http://portal.invalid");
  for (const [rule, kind] of routeRules) {
    const match = url.pathname.match(rule);
    if (match && databaseIdentifierPattern.test(match[2]!)) {
      url.pathname = match[1]! + await recordReference(kind, match[2]!) + (match[3] ?? "");
      break;
    }
  }
  const queries: [string, ReferenceKind][] = [];
  if (url.pathname === "/admin/candidates") queries.push(["categoryId", "category"]);
  if (url.pathname === "/admin/participations") queries.push(["openingId", "opening"], ["candidateId", "candidate"]);
  if (url.pathname === "/admin/metrics" || url.pathname === "/api/admin/exports/operations.csv") queries.push(["category", "category"]);
  if (url.pathname.startsWith("/company/openings/")) queries.push(["referral", "referral"]);
  if (url.pathname === "/admin/imports/new" || url.pathname === "/api/admin/imports/preview") queries.push(["retry", "import"]);
  for (const [key, kind] of queries) {
    const value = url.searchParams.get(key);
    if (value && databaseIdentifierPattern.test(value)) url.searchParams.set(key, await recordReference(kind, value));
  }
  return url.pathname + url.search + url.hash;
}

export async function canonicalReferenceRoute(path: string, query: Record<string, string | string[] | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  const href = path + (params.size ? `?${params}` : "");
  const canonical = await referenceUrl(href);
  if (canonical !== href) redirect(canonical);
}
