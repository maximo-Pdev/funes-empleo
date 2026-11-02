export const RECORD_PAGE_SIZE = 10;
export const HISTORY_PAGE_SIZE = 5;

export function collectionPage(value: unknown): number {
  return typeof value === "string" && /^[1-9]\d{0,4}$/.test(value) ? Number(value) : 1;
}
