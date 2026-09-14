import { z } from 'zod'

/**
 * Boolean env vars: do NOT use `z.coerce.boolean()`.
 *
 * It coerces via `Boolean(value)`, so the STRING `"false"` becomes `true` and the flag can never be
 * turned off from a `.env` file. Declare opt-out flags with this instead:
 *
 * ```ts
 * FEATURE_ENABLED: envFlag(true)   // default on;  "false" / "0" / "no" disables
 * FEATURE_ENABLED: envFlag(false)  // default off; "true" / "1" / "yes" enables
 * ```
 */
export const envFlag = (defaultValue: boolean) =>
  z
    .string()
    .default(String(defaultValue))
    .transform((value) =>
      defaultValue
        ? !['false', '0', 'no'].includes(value.trim().toLowerCase())
        : ['true', '1', 'yes'].includes(value.trim().toLowerCase())
    )

/** The development fallback for JWT_SECRET — long enough to satisfy the schema, and blacklisted below. */
const DEV_JWT_SECRET = 'insecure-development-only-jwt-secret'

/**
 * Known weak/placeholder secrets that must never be used in production — the schema default above and
 * the literal shipped in `.env.example`. Production refuses to boot with either (or any short secret),
 * so a forgotten placeholder can't leave JWTs forgeable. Add your own placeholders here as they appear.
 */
const WEAK_JWT_SECRETS = new Set([DEV_JWT_SECRET, 'change-this-to-a-long-secret'])

/**
 * Every variable has a working development default, so a fresh clone boots with NO `.env` file at
 * all. The defaults are only ever safe for local development — production is held to a stricter
 * standard by the `superRefine` below, which refuses to boot on a placeholder secret. So "it runs out
 * of the box" never becomes "it shipped with the sample credentials".
 */
const baseEnvironmentSchema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default('true'),
  // How many reverse-proxy hops sit in front of this app, or an explicit trust rule. See
  // `resolveTrustProxy` for the accepted forms. Default 1 = one proxy (the usual nginx in front).
  TRUST_PROXY: z.string().default('1'),
  // Local Postgres with the conventional development credentials. An empty `DATABASE_URL=""` counts as
  // unset, so a blank line in a .env file falls back to the default instead of refusing to boot.
  DATABASE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/app?schema=public')
  ),
  SKIP_DATABASE_CONNECT: envFlag(false),
  // Deliberately the placeholder listed in WEAK_JWT_SECRETS: it lets development run unconfigured,
  // and it is precisely what production refuses to start with.
  JWT_SECRET: z.string().min(16).default(DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_USERNAME: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
})

export const environmentVarsSchema = baseEnvironmentSchema.superRefine((env, ctx) => {
  if (process.env.NODE_ENV !== 'production') return
  if (env.JWT_SECRET.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET must be at least 32 characters in production',
    })
  }
  if (WEAK_JWT_SECRETS.has(env.JWT_SECRET)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET is a known placeholder — set a strong, unique secret in production',
    })
  }
})

export type Environment = z.infer<typeof environmentVarsSchema>

/**
 * Turns TRUST_PROXY into the value Express's `trust proxy` setting expects.
 *
 * This decides where `req.ip` comes from, and `req.ip` is what the rate limiter buckets on — so it is
 * a security setting, not a formatting one. Too low and every client behind your proxy shares one
 * bucket (one abuser throttles everyone). Too high and a client can spoof `X-Forwarded-For` to get a
 * fresh bucket per request, or to forge the IP you log.
 *
 * Accepted forms:
 *   - a number  — trust this many hops closest to the app (`1` = one proxy in front). The default.
 *   - `false`   — trust nothing; `req.ip` is the socket address. Correct when nothing fronts the app.
 *   - `true`    — trust every hop. Convenient, and spoofable: only for a trusted private network.
 *   - anything else — passed through verbatim, so Express's own forms work: `loopback`,
 *     `uniquelocal`, or a comma-separated list of IPs/subnets (`10.0.0.0/8, 192.168.0.1`).
 */
export const resolveTrustProxy = (value: string): boolean | number | string => {
  const normalized = value.trim()
  if (normalized === '') return 1
  if (normalized.toLowerCase() === 'true') return true
  if (normalized.toLowerCase() === 'false') return false
  const hops = Number(normalized)
  if (Number.isInteger(hops) && hops >= 0) return hops
  return normalized
}
