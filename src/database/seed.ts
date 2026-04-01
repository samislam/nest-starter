import { PrismaClient } from '@/generated/prisma'
import { runSeeders } from '@/lib/prisma/run-seeders'
import { rootAccountSeeder } from '@/database/seeders/root-account.seeder'

const prisma = new PrismaClient()
console.log('\n')

async function main() {
  runSeeders(prisma, [
    /** Your seeders goes here */
    rootAccountSeeder
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
