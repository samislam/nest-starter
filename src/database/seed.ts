import { config as loadEnv } from 'dotenv'
import { PrismaClient } from '@/generated/prisma'
import { runSeeders } from '@/lib/prisma/run-seeders'
import { rootAccountSeeder } from '@/database/seeders/root-account.seeder'

// Load the env file ourselves. `prisma db seed` reports "Prisma config detected, skipping
// environment variable loading", so DATABASE_URL / ROOT_PASSWORD would otherwise never reach a seeder
// run directly (rather than through `pnpm run setup`, which injects them).
loadEnv({ path: `.env.${process.env.NODE_ENV ?? 'development'}` })
loadEnv({ path: '.env' })

const prisma = new PrismaClient()
console.log('\n')

async function main() {
  // AWAIT this. Without it `main()` resolves immediately, `.finally()` disconnects the client, and
  // the seeders race a closing connection — seeding "succeeds" having written nothing.
  await runSeeders(prisma, [
    /** Your seeders go here */
    rootAccountSeeder,
  ])
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
