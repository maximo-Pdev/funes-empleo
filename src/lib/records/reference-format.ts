export const REFERENCE_PREFIXES = {
  account: "cta", candidate: "can", company: "emp", opening: "ofe", participation: "cas",
  referral: "der", cv: "cv", import: "imp", category: "rub",
} as const;
export type ReferenceKind = keyof typeof REFERENCE_PREFIXES;
export const databaseIdentifierPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isRecordReference(kind: ReferenceKind, value: string): boolean {
  return new RegExp(`^${REFERENCE_PREFIXES[kind]}-[0-9a-f]{24}$`).test(value);
}
