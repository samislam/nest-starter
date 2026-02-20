import { to } from 'await-to-js'
import { PrismaClient } from '@/generated/prisma'
import { SeederFn } from '@/lib/prisma/run-seeders'

export const seedExample: SeederFn<PrismaClient> = async (prismaClient) => {
  const [err] = await to(
    prismaClient.example.upsert({
      where: { email: 'example@email.com' },
      create: {
        email: 'example@email.com',
        name: 'Example User',
      },
      update: {
        name: 'Example User',
      },
    })
  )

  if (err) console.log('❌ Failed to run seeder example')
  else console.log('🌱 Successfully seeded example row')
}
