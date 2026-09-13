type SortOrder = 'asc' | 'desc'
import { getSortArgs, getSelectArgs, getJoinArgs } from '@/common/utils/pagination-helpers'
import { buildPrismaInclude } from '@/lib/prisma/build-prisma-include'

export interface ResourceConfig<
  TField extends string,
  TWhere = unknown,
  TJoin extends string = string,
  TInclude extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Whitelisted sortable fields for this resource. */
  allowedSortBy: readonly TField[]
  /** Whitelisted selectable fields for this resource. */
  allowedSelect: readonly TField[]
  /** Default selected fields when `select` is missing or invalid. */
  defaultSelect: readonly TField[]
  /** Fields that must always be selected in responses. */
  enforcedSelect: readonly TField[]
  /** Default sort field when `sortBy` is missing or invalid. */
  defaultSortBy: TField
  /** Default sort order when `sortOrder` is missing. */
  defaultSortOrder: SortOrder
  /** Optional stable tie-breaker field appended to ordering. */
  tieBreakerField?: TField
  /** Tie-breaker order direction. */
  tieBreakerOrder: SortOrder
  /** Optional mapper for nested/custom Prisma orderBy structures. */
  mapOrderBy?: (field: TField, order: SortOrder) => Record<string, unknown>
  /** Optional resource-specific search mapper. */
  search?: (searchStr?: string) => TWhere | undefined
  /** Whitelisted joinable relations exposed through `?join=`. */
  allowJoin: readonly TJoin[]
  /** Joins applied when `?join=` is omitted. */
  defaultJoin: readonly TJoin[]
  /** Joins always applied, regardless of `?join=`. */
  enforcedJoin: readonly TJoin[]
  /** Map of join key → Prisma include fragment (a key absent here defaults to `true`). Type it via
   * `TInclude` (e.g. `Prisma.UserInclude`) for autocompletion without an inline `satisfies`. */
  joinMap: TInclude
}

export interface ResourceConfigAdapter<
  TField extends string,
  TWhere = unknown,
  TJoin extends string = string,
  TInclude extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Returns the normalized immutable resource config object. */
  getConfig: () => ResourceConfig<TField, TWhere, TJoin, TInclude>
  /** Resolves and validates effective sorting args for this resource. */
  getSortArgs: (opts: { sortBy?: string; sortOrder?: SortOrder }) => {
    sortBy: TField
    sortOrder: SortOrder
    tieBreakerField?: TField
    tieBreakerOrder: SortOrder
  }
  /** Optional resource-level mapper for Prisma orderBy structures. */
  mapOrderBy?: (field: TField, order: SortOrder) => Record<string, unknown>
  /** Resolves and validates effective selected fields for this resource. */
  getSelectArgs: (opts: { select?: string }) => TField[]
  /** Maps optional search string into a resource-specific where/filter object. */
  search: (searchStr?: string) => TWhere | undefined
  /** Resolves the effective `?join=` relations for this resource. */
  getJoinArgs: (opts: { join?: string }) => TJoin[]
  /** Builds the Prisma `include` for the requested `?join=` (or `undefined` when nothing joins). */
  buildInclude: (opts: { join?: string }) => TInclude | undefined
}

interface CreateResourceConfigInput<
  TField extends string,
  TWhere = unknown,
  TJoin extends string = string,
  TInclude extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Whitelisted sortable fields for this resource. */
  allowedSortBy: readonly TField[]
  /** Whitelisted selectable fields for this resource. */
  allowedSelect: readonly TField[]
  /** Default selected fields when `select` is missing or invalid. */
  defaultSelect: readonly TField[]
  /** Fields that must always be selected in responses. */
  enforcedSelect?: readonly TField[]
  /** Default sort field when `sortBy` is missing or invalid. */
  defaultSortBy: TField
  /** Default sort order when `sortOrder` is missing. */
  defaultSortOrder?: SortOrder
  /** Optional stable tie-breaker field appended to ordering. */
  tieBreakerField?: TField
  /** Tie-breaker order direction. */
  tieBreakerOrder?: SortOrder
  /** Optional mapper for nested/custom Prisma orderBy structures. */
  mapOrderBy?: (field: TField, order: SortOrder) => Record<string, unknown>
  /** Optional resource-specific search mapper. */
  search?: (searchStr?: string) => TWhere | undefined
  /** Whitelisted joinable relations exposed through `?join=`. */
  allowJoin?: readonly TJoin[]
  /** Joins applied when `?join=` is omitted. */
  defaultJoin?: readonly TJoin[]
  /** Joins always applied, regardless of `?join=`. */
  enforcedJoin?: readonly TJoin[]
  /** Map of join key → Prisma include fragment (a key absent here defaults to `true`). Type it via
   * `TInclude` (e.g. `Prisma.UserInclude`) for autocompletion without an inline `satisfies`. */
  joinMap?: TInclude
}

/**
 * Creates a normalized resource config object for reusable pagination/sort/select behavior.
 *
 * @param opts  Resource-level configuration such as allowed fields, defaults, and tie-breaker
 *              options.
 * @returns Typed resource config consumed by service helpers.
 */
export function createResourceConfig<
  TField extends string,
  TWhere = unknown,
  TJoin extends string = string,
  TInclude extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: CreateResourceConfigInput<TField, TWhere, TJoin, TInclude>
): ResourceConfigAdapter<TField, TWhere, TJoin, TInclude> {
  const {
    allowedSortBy,
    allowedSelect,
    defaultSelect,
    enforcedSelect = [],
    defaultSortBy,
    defaultSortOrder = 'asc',
    tieBreakerField,
    tieBreakerOrder = 'asc',
    mapOrderBy,
    search,
    allowJoin = [],
    defaultJoin = [],
    enforcedJoin = [],
    joinMap = {} as TInclude,
  } = opts

  const config: ResourceConfig<TField, TWhere, TJoin, TInclude> = {
    allowedSortBy,
    allowedSelect,
    defaultSelect,
    enforcedSelect,
    defaultSortBy,
    defaultSortOrder,
    tieBreakerField,
    tieBreakerOrder,
    mapOrderBy,
    search,
    allowJoin,
    defaultJoin,
    enforcedJoin,
    joinMap,
  }

  const resolveJoins = (join?: string) =>
    getJoinArgs({
      join,
      allowedJoin: config.allowJoin,
      defaultJoin: config.defaultJoin,
      enforcedJoin: config.enforcedJoin,
    })

  return {
    getConfig: () => config,
    getSortArgs: (args) => ({
      ...getSortArgs({
        sortBy: args.sortBy,
        sortOrder: args.sortOrder,
        allowedSortBy: config.allowedSortBy,
        defaultSortBy: config.defaultSortBy,
        defaultSortOrder: config.defaultSortOrder,
      }),
      tieBreakerField: config.tieBreakerField,
      tieBreakerOrder: config.tieBreakerOrder,
    }),
    mapOrderBy: config.mapOrderBy,
    getSelectArgs: (args) =>
      getSelectArgs({
        select: args.select,
        allowedSelect: config.allowedSelect,
        defaultSelect: config.defaultSelect,
        enforcedSelect: config.enforcedSelect,
      }),
    search: (searchStr) => config.search?.(searchStr),
    getJoinArgs: (args) => resolveJoins(args.join),
    buildInclude: (args) => buildPrismaInclude<TInclude>(resolveJoins(args.join), config.joinMap),
  }
}
