import { expect } from "@playwright/test";
import { runLocalMaintenanceSql } from "../local-maintenance";
import { REFERENCE_PREFIXES, type ReferenceKind } from "../../../src/lib/records/reference-format";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function referenceIdentifier(kind: ReferenceKind, value: string) {
  if (uuid.test(value)) return value;
  expect(value).toMatch(new RegExp(`^${REFERENCE_PREFIXES[kind]}-[0-9a-f]{24}$`));
  const id = runLocalMaintenanceSql(`select entity_id from private.record_references where kind='${kind}' and reference='${value}'`);
  expect(id).toMatch(uuid);
  return id;
}
export function persistedReference(kind: ReferenceKind, id: string) {
  expect(id).toMatch(uuid);
  const reference = runLocalMaintenanceSql(`select reference from private.record_references where kind='${kind}' and entity_id='${id}'`);
  expect(reference).toMatch(new RegExp(`^${REFERENCE_PREFIXES[kind]}-[0-9a-f]{24}$`));
  return reference;
}
export function canonicalFixturePath(path: string) {
  const kind: ReferenceKind = path.includes("/candidates/") ? "candidate" : path.includes("/empresas/") ? "company" :
    path.includes("/participations/") ? "participation" : path.includes("/imports/") ? "import" : "opening";
  const canonical = path.replace(/^\/company\/openings\/([^/?]+)\/referrals/, "/empresa/ofertas/$1");
  return canonical.replace(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi, id => persistedReference(kind, id));
}
