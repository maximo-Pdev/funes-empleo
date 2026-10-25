import { createHash } from "node:crypto";
import type { ComponentProps } from "react";
import { REFERENCE_PREFIXES, type ReferenceKind } from "@/lib/records/reference-format";

export function fixtureReference(kind: ReferenceKind, id: string) {
  return `${REFERENCE_PREFIXES[kind]}-${createHash("sha256").update(`test-only:${kind}:${id}`).digest("hex").slice(0, 24)}`;
}

export function fixtureHref(href: string) {
  const url = new URL(href, "http://fixture.invalid");
  const kind: ReferenceKind = url.pathname.includes("/api/cv/") ? "cv" : url.pathname.includes("/participations/") ? "participation" :
    url.pathname.includes("/candidates/") ? "candidate" : url.pathname.includes("/empresas/") ? "company" : url.pathname.includes("/imports/") ? "import" : "opening";
  url.pathname = url.pathname.replace(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi, id => fixtureReference(kind, id));
  for (const [key, value] of url.searchParams) {
    if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
      const queryKind = key === "referral" ? "referral" : key === "candidateId" ? "candidate" : key === "openingId" ? "opening" : key === "retry" ? "import" : "category";
      url.searchParams.set(key, fixtureReference(queryKind, value));
    }
  }
  return href.startsWith("/") ? url.pathname + url.search + url.hash : href;
}

export const referenceMocks = {
  recordReference: async (kind: ReferenceKind, id: string) => fixtureReference(kind, id),
  recordReferences: async (kind: ReferenceKind, ids: (string | null | undefined)[]) => Object.fromEntries(ids.filter(Boolean).map(id => [id, fixtureReference(kind, id!)])),
  routeIdentifier: async (_kind: ReferenceKind, id: string) => id,
};
export const pageReferenceMocks = {
  pageRecordIdentifier: async (_kind: ReferenceKind, id: string) => id,
  referenceFilters: async (_path: string, query: Record<string, unknown>) => query,
};
export const recordLinkMocks = {
  RecordLink: ({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string }) => <a {...props} href={fixtureHref(href)} />,
  RecordAnchor: ({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string }) => <a {...props} href={fixtureHref(href)} />,
  RecordLabel: ({ kind, id }: { kind: ReferenceKind; id: string }) => <>{fixtureReference(kind, id)}</>,
};
