export const REQUEST_USER = 'REQUEST_USER'

// # App error codes
export const UNKNOWN_ERR = 'UNKNOWN_ERR'
export const DUPLICATE_ERR = 'DUPLICATE_ERR'
export const REF_ERR = 'REF_ERR'
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
export const ACCOUNT_FORZEN = 'ACCOUNT_FORZEN'

// # Prisma Error codes
export const PRISMA_DUPLICATE_ERR = 'P2002'
export const PRISMA_NOT_FOUND_ERR = 'P2025'
export const PRISMA_REF_ERR = 'P2003'

export const errorCodes = [
  UNKNOWN_ERR, //
  DUPLICATE_ERR,
  REF_ERR,
  INVALID_CREDENTIALS,
  ACCOUNT_FORZEN,
] as const

export type AppErrorCodes = (typeof errorCodes)[number]
