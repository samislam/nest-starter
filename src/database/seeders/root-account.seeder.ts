import { hash } from 'bcryptjs'
import { PrismaClient } from '@/generated/prisma'
import { SeederFn } from '@/lib/prisma/run-seeders'

export const rootAccountSeeder: SeederFn<PrismaClient> = async (prismaClient) => {
  const passwordHash = await hash('root', 12)

  await prismaClient.user.upsert({
    where: { username: 'root' },
    update: {
      name: 'Admin',
      isActive: true,
    },
    create: {
      name: 'Admin',
      username: 'root',
      passwordHash,
      isActive: true,
    },
  })
}
