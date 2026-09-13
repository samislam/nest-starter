export interface AppConfig {
  appName: string
  appDescription: string
  apiPrefix: string
  uploadDir: string
  /** Largest accepted request body. Express defaults to 100kb, which bulk saves/imports outgrow. */
  bodyLimit: string
  pagination: PaginationConfig
}

/** Bounds for every paginated endpoint; enforced centrally in `getPaginationArgs`. */
export interface PaginationConfig {
  defaultPerPage: number
  /** Hard ceiling. Requests above this are clamped, never rejected. */
  maxPerPage: number
}
