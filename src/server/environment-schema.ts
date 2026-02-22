import { z } from 'zod'

export const environmentVarsSchema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  COINGEKO_API_KEY: z.string().trim(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_USERNAME: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
})
