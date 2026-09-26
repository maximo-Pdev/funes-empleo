export function orderContacts<T extends { id: string; occurred_at: string }>(contacts: readonly T[]): T[] {
  return [...contacts].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime() || a.id.localeCompare(b.id));
}
