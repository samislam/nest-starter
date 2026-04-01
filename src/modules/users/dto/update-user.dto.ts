import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { omitEmptyField } from '@/utils/omit-empty-field'

export const updateUserSchema = z.object({
  name: z.preprocess(omitEmptyField, z.string().trim().min(1).optional()),
})

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
