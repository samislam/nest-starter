/**
 * Builds a Prisma `include` object from a list of resolved join keys and a per-resource map of
 * include fragments. A key present in `joinMap` uses its fragment (e.g. a nested `include`/`select`);
 * a key missing from the map defaults to `true` (a plain relation join). Returns `undefined` when
 * nothing is joined, so the query omits `include` entirely.
 *
 * @param joins    Resolved, already-validated relation keys to join (see `getJoinArgs`).
 * @param joinMap  Optional map of join key → Prisma include fragment.
 */
export function buildPrismaInclude<TInclude extends Record<string, unknown>>(
  joins: readonly string[],
  joinMap: Readonly<Record<string, unknown>> = {}
): TInclude | undefined {
  if (joins.length === 0) return undefined

  const include: Record<string, unknown> = {}
  for (const key of joins) include[key] = joinMap[key] ?? true
  return include as TInclude
}
