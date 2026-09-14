import { hash } from 'bcryptjs'
import { PrismaClient } from '@/generated/prisma'
import { SeederFn } from '@/lib/prisma/run-seeders'

/**
 * The first account, so a fresh install has something to log in with.
 *
 * Credentials come from ROOT_USERNAME / ROOT_PASSWORD and fall back to `root` / `root` — convenient
 * locally, and useless to anyone who cannot already reach your database. The seeder PRINTS what it
 * created, because a starting password that lives only inside a seeder file is a password nobody can
 * find.
 *
 * `update` deliberately leaves the password alone: re-running the seeder (it runs on every deploy)
 * must never reset a password that has since been changed. Delete the row if you want it reissued.
 */
export const rootAccountSeeder: SeederFn<PrismaClient> = async (prismaClient) => {
  const username = process.env.ROOT_USERNAME?.trim() || 'root'
  const password = process.env.ROOT_PASSWORD?.trim() || 'root'
  const passwordHash = await hash(password, 12)

  const existing = await prismaClient.user.findUnique({ where: { username } })

  await prismaClient.user.upsert({
    where: { username },
    update: {
      name: 'Admin',
      isActive: true,
    },
    create: {
      name: 'Admin',
      username,
      passwordHash,
      isActive: true,
    },
  })

  if (existing) {
    console.log(`  root account "${username}" already exists — password left unchanged.`)
    return
  }

  console.log(`  created the root account — sign in with:`)
  console.log(`      username: ${username}`)
  console.log(`      password: ${password}`)
  if (password === 'root') {
    console.log(`  ⚠ this is the default password. Set ROOT_PASSWORD before seeding anything real.`)
  }
}
