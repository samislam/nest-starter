type SortOrder = 'asc' | 'desc'

interface BuildPrismaOrderByInput<
  TSortField extends string,
  TOrderByInput extends Record<string, unknown>,
> {
  /** Primary field used for sorting. */
  sortBy: TSortField
  /** Primary sort direction. */
  sortOrder: SortOrder
  /** Optional tie-breaker field for stable ordering. */
  tieBreakerField?: TSortField
  /** Optional tie-breaker direction. Defaults to `asc`. */
  tieBreakerOrder?: SortOrder
  /** Optional mapper for nested/custom Prisma orderBy structures. */
  mapField?: (field: TSortField, order: SortOrder) => TOrderByInput
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
>(opts: BuildPrismaOrderByInput<TSortField, TOrderByInput>): TOrderByInput[] {
  const { sortBy, sortOrder, tieBreakerField, tieBreakerOrder = 'asc', mapField } = opts
  const toOrderBy = (field: TSortField, order: SortOrder) =>
    mapField ? mapField(field, order) : ({ [field]: order } as unknown as TOrderByInput)

  const orderBy = [toOrderBy(sortBy, sortOrder)]

  if (tieBreakerField && tieBreakerField !== sortBy) {
    orderBy.push(toOrderBy(tieBreakerField, tieBreakerOrder))
  }

  return orderBy
}
