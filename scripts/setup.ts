import chalk from 'chalk'
import { existsSync } from 'fs'
import { Prisma } from '@clscripts/prisma'
import { runCommand } from '@clscripts/cl-common'
import { DotenvCli } from '@clscripts/dotenv-cli'

const nodeEnv = process.env.NODE_ENV ?? 'development'
const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

/**
 * Brings a freshly cloned checkout to a runnable state — the machine-provisioning half of
 * `bin/deploy.sh`, which a dev device has no other way to get. Every step is idempotent, so this is
 * also safe to re-run on an already-provisioned box.
 *
 * The order is a dependency chain, not a preference: the seeders import `@/generated/prisma` (so
 * `generate` must come first) and write rows (so the tables must exist first). `db seed` runs the
 * command declared in `prisma.config.ts`.
 */
const steps = [
  { label: 'prisma generate', command: new Prisma({ mode: 'generate' }).command },
  { label: 'prisma migrate deploy', command: new Prisma({ mode: 'deploy' }).command },
  { label: 'prisma db seed', command: new Prisma({ mode: 'seed' }).command },
]

/**
 * Matches the schema default in `src/server/environment-schema.ts`, so a fresh clone with no `.env`
 * provisions against the same local database the app will then boot against. Keep the two in step.
 */
const DEV_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/app?schema=public'

if (dotenvFile) {
  console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
} else if (process.env.DATABASE_URL) {
  console.log(chalk.cyanBright('Using DATABASE_URL from environment (no env file found)'))
} else {
  // No env file and no DATABASE_URL: fall back to the development default rather than refusing to
  // run, so `pnpm run setup` works on a fresh clone with nothing configured. The prisma CLI reads it
  // from the environment we pass down.
  process.env.DATABASE_URL = DEV_DATABASE_URL
  console.log(
    chalk.yellowBright('No env file found — using the development default database:\n  '),
    chalk.bold.greenBright(DEV_DATABASE_URL)
  )
}

// `runCommand` throws on a non-zero exit, so a failing step aborts the rest rather than seeding into
// a database that never migrated.
steps.forEach((step, index) => {
  console.log(chalk.cyanBright(`\n==> [${index + 1}/${steps.length}] ${step.label}`))
  runCommand(
    dotenvFile ? new DotenvCli({ envFile: dotenvFile, execute: step.command }).command : step.command
  )
})

console.log(chalk.bold.greenBright('\n✔ setup complete'))
