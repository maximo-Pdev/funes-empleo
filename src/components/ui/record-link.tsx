import Link from "next/link";
import type { ComponentProps } from "react";
import { referenceUrl } from "@/lib/records/reference-url";
import { recordReference } from "@/lib/records/references";
import type { ReferenceKind } from "@/lib/records/reference-format";

export async function RecordLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const url = await referenceUrl(href);
  return <Link {...props} href={url} />;
}
export async function RecordAnchor({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string }) {
  const url = await referenceUrl(href);
  return <a {...props} href={url} />;
}
export async function RecordLabel({ kind, id }: { kind: ReferenceKind; id: string }) {
  return <>{await recordReference(kind, id)}</>;
}
