import chalk from 'chalk'
import { existsSync, readFileSync } from 'fs'
import { Prisma } from '@clscripts/prisma'
import { runCommand } from '@clscripts/cl-common'
import { DotenvCli } from '@clscripts/dotenv-cli'

const nodeEnv = process.env.NODE_ENV ?? 'development'
const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

/**
 * Matches the schema default in `src/server/environment-schema.ts`, so a fresh clone with no `.env`
 * provisions against the same local database the app will then boot against. Keep the two in step.
 */
const DEV_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/app?schema=public'

/** The DATABASE_URL this run will provision, from the env file if there is one. */
function resolveDatabaseUrl(): string {
  if (dotenvFile) {
    const match = readFileSync(dotenvFile, 'utf8').match(
      /^\s*DATABASE_URL\s*=\s*["']?([^"'\n]+)/m
    )
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return process.env.DATABASE_URL?.trim() || DEV_DATABASE_URL
}

/**
 * Creates the target database if it is not there yet.
 *
 * `prisma migrate deploy` does NOT create databases — it fails with P1003 — so without this a fresh
 * clone cannot be provisioned in one command, which is the entire point of this script. We connect
 * to the `postgres` maintenance database on the same server and issue a CREATE. Uses the generated
 * Prisma client rather than adding a `pg` dependency just for this.
 */
async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
  const parsed = new URL(databaseUrl)
  const databaseName = parsed.pathname.replace(/^\//, '').split('?')[0]
  if (!databaseName) return

  const adminUrl = new URL(databaseUrl)
  adminUrl.pathname = '/postgres'
  adminUrl.search = ''

  // Imported lazily: `prisma generate` (step 1) must have produced this module before we load it.
  const { PrismaClient } = await import('../src/generated/prisma')

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } })
  try {
    const rows = await admin.$queryRawUnsafe<unknown[]>(
      `SELECT 1 FROM pg_database WHERE datname = '${databaseName.replace(/'/g, "''")}'`
    )
    if (rows.length > 0) {
      console.log(chalk.cyanBright(`    database "${databaseName}" already exists`))
      return
    }
    // The name comes from our own DATABASE_URL, not from user input at runtime; quote it anyway so a
    // hyphenated name works.
    await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`)
    console.log(chalk.greenBright(`    created database "${databaseName}"`))
  } catch (error) {
    // Not fatal on its own: the database may exist but be unreachable by this role, or the server may
    // be down — either way `migrate deploy` is about to say so far more precisely.
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error)
    console.log(chalk.yellowBright(`    could not verify/create the database: ${message}`))
  } finally {
    await admin.$disconnect()
  }
}

/**
 * Brings a freshly cloned checkout to a runnable state — the machine-provisioning half of
 * `bin/deploy.sh`, which a dev device has no other way to get. Every step is idempotent, so this is
 * also safe to re-run on an already-provisioned box.
 *
 * The order is a dependency chain, not a preference: the seeders import `@/generated/prisma` (so
 * `generate` must come first), the database must exist before it can be migrated, and the tables must
 * exist before rows can be written. `db seed` runs the command declared in `prisma.config.ts`.
 */
const steps = [
  { label: 'prisma generate', command: new Prisma({ mode: 'generate' }).command },
  { label: 'create database (if missing)', command: null },
  { label: 'prisma migrate deploy', command: new Prisma({ mode: 'deploy' }).command },
  { label: 'prisma db seed', command: new Prisma({ mode: 'seed' }).command },
]

async function main() {
  if (dotenvFile) {
    console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
  } else if (process.env.DATABASE_URL) {
    console.log(chalk.cyanBright('Using DATABASE_URL from environment (no env file found)'))
  } else {
    // No env file and no DATABASE_URL: fall back to the development default rather than refusing to
    // run, so `pnpm run setup` works on a fresh clone with nothing configured.
    process.env.DATABASE_URL = DEV_DATABASE_URL
    console.log(
      chalk.yellowBright('No env file found — using the development default database:\n  '),
      chalk.bold.greenBright(DEV_DATABASE_URL)
    )
  }

  const databaseUrl = resolveDatabaseUrl()

  // `runCommand` throws on a non-zero exit, so a failing step aborts the rest rather than seeding
  // into a database that never migrated.
  for (const [index, step] of steps.entries()) {
    console.log(chalk.cyanBright(`\n==> [${index + 1}/${steps.length}] ${step.label}`))
    if (!step.command) {
      await ensureDatabaseExists(databaseUrl)
      continue
    }
    runCommand(
      dotenvFile
        ? new DotenvCli({ envFile: dotenvFile, execute: step.command }).command
        : step.command
    )
  }

  console.log(chalk.bold.greenBright('\n✔ setup complete'))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(chalk.bold.redBright(`\n✖ setup failed: ${message}`))
  process.exit(1)
})
