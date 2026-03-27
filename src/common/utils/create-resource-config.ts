type SortOrder = 'asc' | 'desc'
import { getSortArgs, getSelectArgs } from '@/common/utils/pagination-helpers'

export interface ResourceConfig<TField extends string, TWhere = unknown> {
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
  /** Optional resource-specific search mapper. */
  search?: (searchStr?: string) => TWhere | undefined
}

export interface ResourceConfigAdapter<TField extends string, TWhere = unknown> {
  /** Returns the normalized immutable resource config object. */
  getConfig: () => ResourceConfig<TField, TWhere>
  /** Resolves and validates effective sorting args for this resource. */
  getSortArgs: (opts: { sortBy?: string; sortOrder?: SortOrder }) => {
    sortBy: TField
    sortOrder: SortOrder
    tieBreakerField?: TField
    tieBreakerOrder: SortOrder
  }
  /** Resolves and validates effective selected fields for this resource. */
  getSelectArgs: (opts: { select?: string }) => TField[]
  /** Maps optional search string into a resource-specific where/filter object. */
  search: (searchStr?: string) => TWhere | undefined
}

interface CreateResourceConfigInput<TField extends string, TWhere = unknown> {
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
  /** Optional resource-specific search mapper. */
  search?: (searchStr?: string) => TWhere | undefined
}

/**
 * Creates a normalized resource config object for reusable pagination/sort/select behavior.
 *
 * @param opts  Resource-level configuration such as allowed fields, defaults, and tie-breaker
 *              options.
 * @returns Typed resource config consumed by service helpers.
 */
export function createResourceConfig<TField extends string, TWhere = unknown>(
  opts: CreateResourceConfigInput<TField, TWhere>
): ResourceConfigAdapter<TField, TWhere> {
  const {
    allowedSortBy,
    allowedSelect,
    defaultSelect,
    enforcedSelect = [],
    defaultSortBy,
    defaultSortOrder = 'asc',
    tieBreakerField,
    tieBreakerOrder = 'asc',
    search,
  } = opts

  const config: ResourceConfig<TField, TWhere> = {
    allowedSortBy,
    allowedSelect,
    defaultSelect,
    enforcedSelect,
    defaultSortBy,
    defaultSortOrder,
    tieBreakerField,
    tieBreakerOrder,
    search,
  }

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
    getSelectArgs: (args) =>
      getSelectArgs({
        select: args.select,
        allowedSelect: config.allowedSelect,
        defaultSelect: config.defaultSelect,
        enforcedSelect: config.enforcedSelect,
      }),
    search: (searchStr) => config.search?.(searchStr),
  }
}
