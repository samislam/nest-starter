import { z } from 'zod'

export const environmentVarsSchema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_USERNAME: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
})

export type Environment = z.infer<typeof environmentVarsSchema>
