import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const registerSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(3),
  password: z.string().min(4),
})

export class RegisterDto extends createZodDto(registerSchema) {}
