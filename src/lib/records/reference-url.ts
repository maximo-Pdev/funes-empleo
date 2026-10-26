import "server-only";
import { redirect } from "next/navigation";
import { recordReference } from "./references";
import { databaseIdentifierPattern, type ReferenceKind } from "./reference-format";

const routeRules: readonly [RegExp, ReferenceKind][] = [
  [/^(\/admin\/candidates\/(?:assisted\/)?)([^/]+)$/, "candidate"],
  [/^(\/admin\/empresas\/)([^/]+)$/, "company"],
  [/^(\/(?:admin\/openings|empresa\/ofertas)\/)([^/]+)$/, "opening"],
  [/^(\/admin\/participations\/)([^/]+)$/, "participation"],
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
  if (url.pathname === "/admin/candidates" || url.pathname === "/admin/atencion-presencial") queries.push(["categoryId", "category"]);
  if (url.pathname === "/admin/participations") queries.push(["openingId", "opening"], ["candidateId", "candidate"]);
  if (url.pathname === "/admin/metrics" || url.pathname === "/api/admin/exports/operations.csv") queries.push(["category", "category"]);
  if (/^\/empresa\/ofertas\/[^/]+$/.test(url.pathname)) queries.push(["referral", "referral"]);
  for (const [key, kind] of queries) {
    const values = url.searchParams.getAll(key);
    if (values.length === 0) continue;
    const converted = await Promise.all(values.map(value =>
      value && databaseIdentifierPattern.test(value) ? recordReference(kind, value) : value));
    let index = 0;
    const rebuilt: [string, string][] = Array.from(url.searchParams.entries()).map(([k, value]) =>
      k === key ? [k, converted[index++]!] : [k, value]);
    url.search = `?${rebuilt.map(([k, value]) => `${encodeURIComponent(k)}=${encodeURIComponent(value)}`).join("&")}`;
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
