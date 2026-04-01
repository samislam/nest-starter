import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const idParamSchema = z.object({
  id: z.string().trim().min(1),
})

export class IdParamDto extends createZodDto(idParamSchema) {}
