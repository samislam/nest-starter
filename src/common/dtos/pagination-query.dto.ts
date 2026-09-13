import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { omitEmptyField } from '@/utils/omit-empty-field'

export const paginationQuerySchema = z.object({
  page: z.preprocess(omitEmptyField, z.coerce.number().int().min(1).optional()),
  perPage: z.preprocess(omitEmptyField, z.coerce.number().int().min(1).max(250).optional()),
  select: z.preprocess(omitEmptyField, z.string().trim().min(1).optional()),
  // Comma-separated relations to join (e.g. `a,b`) or `all`. An explicit empty `?join=` joins
  // nothing; omitting it falls back to the resource's defaultJoin. Governed by the resource config.
  join: z.string().trim().optional(),
  sortBy: z.preprocess(omitEmptyField, z.string().trim().min(1).optional()),
  sortOrder: z.preprocess(omitEmptyField, z.enum(['asc', 'desc']).optional()),
  search: z.preprocess(
    omitEmptyField,
    z
      .string()
      .trim()
      .transform((value) => value.toLowerCase())
      .optional()
  ),
})

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}
