import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const omitEmptyField = (value: unknown) => {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}

export const paginationQuerySchema = z.object({
  page: z.preprocess(omitEmptyField, z.coerce.number().int().min(1).default(1)),
  perPage: z.preprocess(omitEmptyField, z.coerce.number().int().min(1).max(250).default(20)),
  select: z.preprocess(omitEmptyField, z.string().trim().min(1).optional()),
  sortBy: z.preprocess(omitEmptyField, z.string().trim().min(1).optional()),
  sortOrder: z.preprocess(omitEmptyField, z.enum(['asc', 'desc']).default('asc')),
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
