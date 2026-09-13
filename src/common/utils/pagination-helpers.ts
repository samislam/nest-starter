import appConfig from '@/config/app.config'

/** Standard paginated response envelope. */
export interface PaginatedResponse<T> {
  /** Current page records. */
  data: T[]
  /** Number of records in the current page. */
  count: number
  /** Total number of records across all pages. */
  total: number
  /** Current page number (1-based). */
  page: number
  /** Total number of available pages. */
  totalPages: number
  /** Number of records requested per page. */
  perPage: number
  /** Whether the current page is the last page. */
  isLastPage: boolean
  /** Whether the current page is the first page. */
  isFirstPage: boolean
}

interface PaginationInput {
  /** Current page number (1-based). */
  page?: number
  /** Number of records requested per page. */
  perPage?: number
}

interface NormalizedPaginationInput {
  /** Current page number (1-based). */
  page: number
  /** Number of records requested per page. */
  perPage: number
}

interface BuildPaginatedResponseParams<T> extends NormalizedPaginationInput {
  /** Records for the current page. */
  data: T[]
  /** Total number of records across all pages. */
  total: number
}

interface PaginationArgs extends NormalizedPaginationInput {
  /** Number of records to skip before fetching the current page. */
  skip: number
  /** Number of records to fetch for the current page. */
  take: number
}

type SortOrder = 'asc' | 'desc'

interface SortArgs<TSortField extends string> {
  /** Field name used for sorting results. */
  sortBy: TSortField
  /** Sort direction for the selected sort field. */
  sortOrder: SortOrder
}

interface GetSortArgsInput<TSortField extends string> {
  /** Requested field name to sort by. */
  sortBy?: string
  /** Requested sort direction. */
  sortOrder?: SortOrder
  /** Whitelisted sortable fields for the current module/resource. */
  allowedSortBy: readonly TSortField[]
  /** Default field used when requested `sortBy` is missing or invalid. */
  defaultSortBy: TSortField
  /** Default direction used when `sortOrder` is not provided. */
  defaultSortOrder?: SortOrder
}

interface GetSelectArgsInput<TSelectField extends string> {
  /** Comma-separated requested select fields (e.g. `id,name,image`). */
  select?: string
  /** Whitelisted selectable fields for the current module/resource. */
  allowedSelect: readonly TSelectField[]
  /** Default selected fields when `select` is missing or invalid. */
  defaultSelect: readonly TSelectField[]
  /** Fields that must always be selected. */
  enforcedSelect?: readonly TSelectField[]
}

/** Sentinel `?join=` value that expands to every allowed join. */
export const JOIN_ALL = 'all'

interface GetJoinArgsInput<TJoinField extends string> {
  /** Comma-separated requested joins (e.g. `verificationStatus,saleChannelUsers`), or `all`. */
  join?: string
  /** Whitelisted joinable relations for the current module/resource. */
  allowedJoin: readonly TJoinField[]
  /** Joins applied when `join` is omitted entirely. */
  defaultJoin?: readonly TJoinField[]
  /** Joins always applied, regardless of request. */
  enforcedJoin?: readonly TJoinField[]
}

/**
 * Creates a normalized paginated response object used by API endpoints.
 *
 * @param params  Response payload and pagination metadata.
 * @returns Paginated response with page flags and computed total pages.
 */
export function buildPaginatedResponse<T>(
  opts: BuildPaginatedResponseParams<T>
): PaginatedResponse<T> {
  const { data, total, page, perPage } = opts
  const safePage = Math.max(1, page)
  const safePerPage = Math.max(1, perPage)
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePerPage)

  return {
    total,
    perPage: safePerPage,
    page: safePage,
    totalPages,
    isFirstPage: safePage === 1,
    isLastPage: totalPages === 0 || safePage >= totalPages,
    count: data.length,
    data,
  }
}

/**
 * Builds database pagination arguments from page/perPage input.
 *
 * @param opts  Pagination input values.
 * @returns Pagination arguments including `skip` and `take` for DB queries.
 */
export function getPaginationArgs(opts: PaginationInput): PaginationArgs {
  // Clamp here rather than trusting each caller's DTO. `perPage` went straight through to Prisma's
  // `take`, and only 4 of the query DTOs across 12 paginated services bounded it — so
  // `?perPage=10000000` became a ten-million-row read and an out-of-memory restart. A per-DTO
  // `.max()` is something you have to remember on every new endpoint; this cannot be forgotten.
  // Non-finite and negative values collapse to the default rather than producing a negative `skip`.
  const { defaultPerPage, maxPerPage } = appConfig.pagination
  const requestedPage = Number(opts.page)
  const requestedPerPage = Number(opts.perPage)
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1
  const perPage = Number.isFinite(requestedPerPage)
    ? Math.min(maxPerPage, Math.max(1, Math.floor(requestedPerPage)))
    : defaultPerPage

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

/**
 * Normalizes and validates sorting input against an allow-list.
 *
 * @param opts  Sorting input plus allowed fields and defaults.
 * @returns Safe sorting arguments that can be used to build DB orderBy clauses.
 */
export function getSortArgs<TSortField extends string>(
  opts: GetSortArgsInput<TSortField>
): SortArgs<TSortField> {
  const { sortBy, sortOrder, allowedSortBy, defaultSortBy, defaultSortOrder = 'asc' } = opts

  const isAllowedSortBy = sortBy ? allowedSortBy.includes(sortBy as TSortField) : false

  return {
    sortBy: isAllowedSortBy ? (sortBy as TSortField) : defaultSortBy,
    sortOrder: sortOrder ?? defaultSortOrder,
  }
}

/**
 * Parses and validates a comma-separated select list against an allow-list.
 *
 * @param opts  Select input plus allowed/default fields.
 * @returns Normalized select fields (defaults are used when input is missing/invalid).
 */
export function getSelectArgs<TSelectField extends string>(
  opts: GetSelectArgsInput<TSelectField>
): TSelectField[] {
  const { select, allowedSelect, defaultSelect, enforcedSelect = [] } = opts
  const toCanonicalOrder = (fields: readonly TSelectField[]) => {
    const selectedSet = new Set(fields)
    return allowedSelect.filter((field) => selectedSet.has(field))
  }

  if (!select) return toCanonicalOrder([...defaultSelect, ...enforcedSelect])

  const normalizedFields = [...new Set(select.split(',').map((value) => value.trim()))]
  const selected = normalizedFields.filter(
    (field): field is TSelectField => !!field && allowedSelect.includes(field as TSelectField)
  )

  const baseSelect = selected.length > 0 ? selected : [...defaultSelect]
  return toCanonicalOrder([...baseSelect, ...enforcedSelect])
}

/**
 * Normalizes and validates the `?join=` relation list against an allow-list.
 *
 * Resolution: an omitted `join` uses `defaultJoin`; `join=all` expands to every allowed join; any
 * other value is split on commas and intersected with `allowedJoin` (unknown/disallowed keys are
 * dropped, so an explicit `?join=` with no valid keys joins nothing). `enforcedJoin` is always added.
 *
 * @param opts  Join input plus allowed/default/enforced relations.
 * @returns Deduplicated join keys in canonical (allow-list) order.
 */
export function getJoinArgs<TJoinField extends string>(
  opts: GetJoinArgsInput<TJoinField>
): TJoinField[] {
  const { join, allowedJoin, defaultJoin = [], enforcedJoin = [] } = opts
  const toCanonicalOrder = (fields: readonly TJoinField[]) => {
    const selectedSet = new Set(fields)
    return allowedJoin.filter((field) => selectedSet.has(field))
  }

  let requested: readonly TJoinField[]
  if (join === undefined) {
    requested = defaultJoin
  } else if (join.trim().toLowerCase() === JOIN_ALL) {
    requested = allowedJoin
  } else {
    const normalizedFields = [...new Set(join.split(',').map((value) => value.trim()))]
    requested = normalizedFields.filter(
      (field): field is TJoinField => !!field && allowedJoin.includes(field as TJoinField)
    )
  }

  return toCanonicalOrder([...requested, ...enforcedJoin])
}
