import chalk from 'chalk'
import { existsSync } from 'fs'
import { Prisma } from '@clscripts/prisma'
import { runCommand } from '@clscripts/cl-common'
import { DotenvCli } from '@clscripts/dotenv-cli'

/**
 * Generates the Prisma client, so a fresh clone typechecks and runs.
 *
 * That is all it does on purpose. A database is OPTIONAL in this template — the app boots without one
 * (see SKIP_DATABASE_CONNECT) — so setup never creates, migrates or seeds anything. When your project
 * actually wants a database, that is your call to make explicitly:
 *
 *     createdb <name>                # or however you provision it
 *     pnpm run prisma migrate        # then migrate
 *     pnpm run prisma -- db seed     # and seed, if you kept the seeders
 */
const nodeEnv = process.env.NODE_ENV ?? 'development'
const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

const generate = new Prisma({ mode: 'generate' }).command

if (dotenvFile) {
  console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
  runCommand(new DotenvCli({ envFile: dotenvFile, execute: generate }).command)
} else {
  // No env file is fine: `prisma generate` does not need DATABASE_URL, and every variable has a
  // development default anyway.
  console.log(chalk.cyanBright('No environment file found — using defaults.'))
  runCommand(generate)
}
