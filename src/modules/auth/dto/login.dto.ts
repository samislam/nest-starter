import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

export class LoginDto extends createZodDto(loginSchema) {}
