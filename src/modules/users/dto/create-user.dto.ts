import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const createUserSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(3),
  passwordHash: z.string().min(8),
  isActive: z.boolean().optional(),
})

export class CreateUserDto extends createZodDto(createUserSchema) {}
