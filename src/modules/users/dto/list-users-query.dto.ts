import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { paginationQuerySchema } from '@/common/dtos/pagination-query.dto'

export const listUsersQuerySchema = paginationQuerySchema.extend({
  isActive: z.boolean().optional(),
})

export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
