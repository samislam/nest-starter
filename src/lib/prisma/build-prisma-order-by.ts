type SortOrder = 'asc' | 'desc'

interface BuildPrismaOrderByInput<TSortField extends string> {
  /** Primary field used for sorting. */
  sortBy: TSortField
  /** Primary sort direction. */
  sortOrder: SortOrder
  /** Optional tie-breaker field for stable ordering. */
  tieBreakerField?: TSortField
  /** Optional tie-breaker direction. Defaults to `asc`. */
  tieBreakerOrder?: SortOrder
}

/**
 * Builds Prisma-compatible `orderBy` clauses from normalized sorting input.
 *
 * @param opts  Sorting options including primary field/order and optional tie-breaker.
 * @returns Ordered list of Prisma `orderBy` objects for use in `findMany`.
 */
export function buildPrismaOrderBy<
  TSortField extends string,
  TOrderByInput extends Record<string, unknown>,
>(opts: BuildPrismaOrderByInput<TSortField>): TOrderByInput[] {
  const { sortBy, sortOrder, tieBreakerField, tieBreakerOrder = 'asc' } = opts

  const orderBy = [{ [sortBy]: sortOrder } as unknown as TOrderByInput]

  if (tieBreakerField && tieBreakerField !== sortBy) {
    orderBy.push({ [tieBreakerField]: tieBreakerOrder } as unknown as TOrderByInput)
  }

  return orderBy
}
