/** Complete authorized table projections without PostgREST's implicit row cutoff.
 * Callers must apply their existing filters and a unique, stable order.
 */
export async function readAllRows<T>(query: (from: number, to: number) => PromiseLike<{
  data: readonly T[] | null; error: unknown;
}>) {
  const data: T[] = [];
  const batch = 200;
  for (let from = 0; ; from += batch) {
    const result = await query(from, from + batch - 1);
    if (result.error) return { data: [] as T[], error: result.error };
    const rows = result.data ?? [];
    data.push(...rows);
    if (rows.length < batch) return { data, error: null };
  }
}
