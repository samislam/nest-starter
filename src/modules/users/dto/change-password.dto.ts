import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { omitEmptyField } from '@/utils/omit-empty-field'

export const changePasswordSchema = z.object({
  password: z.preprocess(omitEmptyField, z.string().min(8)),
})

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
