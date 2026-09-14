import { PrismaClient } from '@/generated/prisma'
import { runSeeders } from '@/lib/prisma/run-seeders'
import { rootAccountSeeder } from '@/database/seeders/root-account.seeder'

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
