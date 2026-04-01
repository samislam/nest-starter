import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const createUserRequestSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(3),
  password: z.string().min(8),
  isActive: z.boolean().optional(),
})

export class CreateUserRequestDto extends createZodDto(createUserRequestSchema) {}
