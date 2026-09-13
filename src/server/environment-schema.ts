import { z } from 'zod'

const baseEnvironmentSchema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default('true'),
  DATABASE_URL: z.string().min(1),
  SKIP_DATABASE_CONNECT: z.coerce.boolean().default(false),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_USERNAME: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
})

/**
 * Known weak/placeholder secrets that must never be used in production. The repo ships this literal in
 * `.env.example` for local convenience; refuse to boot prod with it (or any short secret), so a
 * forgotten placeholder can't leave JWTs forgeable. Add your own placeholders here as they appear.
 */
const WEAK_JWT_SECRETS = new Set(['change-this-to-a-long-secret'])

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
