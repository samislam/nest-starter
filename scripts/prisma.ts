import chalk from 'chalk'
import { existsSync, readFileSync } from 'fs'
import { concat } from 'concat-str'
import { DotenvCli } from '@clscripts/dotenv-cli'
import { runCommand } from '@clscripts/cl-common'
import { Prisma, PrismaRunMode } from '@clscripts/prisma'
import { select, confirm, input } from '@inquirer/prompts'

const shellEscape = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`

/**
 * Set this to the target database name to run a destructive command non-interactively (CI) or against
 * production. It must equal the exact DB name in the selected env file's DATABASE_URL — a blanket
 * "yes" is deliberately not accepted.
 */
const DESTRUCTIVE_OVERRIDE_ENV = 'ALLOW_DESTRUCTIVE_PRISMA'

/**
 * True when the prisma invocation will drop/recreate tables and delete data — `migrate reset`,
 * `db push --force-reset`, or any `--accept-data-loss`. These are the only paths that wipe data, so
 * they're the only ones gated (`deploy`, `generate`, `studio`, etc. pass through untouched).
 */
function isDestructiveCommand(tokens: string[]): boolean {
  const joined = ` ${tokens.join(' ').toLowerCase()} `
  return / reset /.test(joined) || joined.includes('--force-reset') || joined.includes('--accept-data-loss')
}

/** Best-effort host + database name from the selected env file's DATABASE_URL (for display + confirm). */
function readDatabaseTarget(envFile: string): { host: string; name: string } | null {
  try {
    const match = readFileSync(envFile, 'utf8').match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\n]+)/m)
    if (!match) return null
    const parsed = new URL(match[1])
    return { host: parsed.host, name: parsed.pathname.replace(/^\//, '').split('?')[0] }
  } catch {
    return null
  }
}

/**
 * The safety on the reset gun. Before any data-destroying prisma command runs, force a deliberate,
 * environment-aware confirmation. Production is gated on NODE_ENV / the selected env file — never on the
 * DB host, because prod and dev both point DATABASE_URL at localhost here, so a host check would fail
 * open. Aborts the process unless the operator proves intent.
 */
async function guardDestructiveCommand(opts: {
  description: string
  nodeEnv: string
  envFile: string
  isProduction: boolean
}): Promise<void> {
  const target = readDatabaseTarget(opts.envFile)
  const dbLabel = target ? `${target.host}/${target.name}` : `(unknown — inspect ${opts.envFile})`
  const override = process.env[DESTRUCTIVE_OVERRIDE_ENV]
  const overrideMatches = !!target && override === target.name

  console.log('')
  console.log(chalk.bold.redBright('  🚨  DESTRUCTIVE DATABASE COMMAND  🚨'))
  console.log(chalk.redBright(`     Command:      ${opts.description}`))
  console.log(chalk.redBright(`     Environment:  ${opts.nodeEnv}  (env file: ${opts.envFile})`))
  console.log(chalk.redBright(`     Target DB:    ${dbLabel}`))
  console.log(
    chalk.redBright('     This DROPS every table and PERMANENTLY DELETES all data in that database.')
  )
  console.log('')

  // Production: never wipe without an explicit, DB-name-specific override env var — a typed prompt
  // alone is too easy to fat-finger on a prod shell.
  if (opts.isProduction && !overrideMatches) {
    console.error(
      chalk.bold.redBright(
        `Refusing to run a destructive command against PRODUCTION.\n` +
          `If you truly intend this, re-run with ${DESTRUCTIVE_OVERRIDE_ENV}=${target?.name ?? '<database-name>'} set.`
      )
    )
    process.exit(1)
  }

  // Non-interactive shell (CI, piped): the typed confirmation is impossible, so require the override.
  if (!process.stdin.isTTY) {
    if (overrideMatches) return
    console.error(
      chalk.redBright(
        `Non-interactive shell: refusing a destructive command without confirmation.\n` +
          `Re-run with ${DESTRUCTIVE_OVERRIDE_ENV}=${target?.name ?? '<database-name>'} to proceed.`
      )
    )
    process.exit(1)
  }

  // Interactive: make the operator type the exact database name — no muscle-memory "y".
  const expected = target?.name ?? ''
  const typed = await input({
    message: `Type the database name (${chalk.bold(expected || '<database-name>')}) to confirm this wipe:`,
  })
  if (!expected || typed.trim() !== expected) {
    console.error(chalk.redBright('Confirmation did not match — aborting. Nothing was changed.'))
    process.exit(1)
  }
}

async function main() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
  const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))
  if (!dotenvFile) {
    console.error("You don't have any environment file specified, please define one first!")
    process.exit(-1)
  }
  console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))

  // Production is keyed on NODE_ENV / the selected env file — NOT the DB host (prod & dev both use
  // localhost here, so a host check would fail open in production).
  const isProduction = nodeEnv === 'production' || /\.env\.production(\.local)?$/.test(dotenvFile)

  // Read command-line arguments
  const args = process.argv.slice(2) // Ignore "node/bun" and script filename
  const wantsExplicitPassthrough = args[0] === '--'
  const passthroughArgs = wantsExplicitPassthrough ? args.slice(1) : args
  const maybeMode = passthroughArgs[0]

  if (passthroughArgs.length > 0 && (wantsExplicitPassthrough || !maybeMode)) {
    // The passthrough branch forwards arbitrary args straight to the prisma CLI — the exact hole that
    // let `migrate reset` / `db push --force-reset` run unguarded. Gate it if it's destructive.
    if (isDestructiveCommand(passthroughArgs)) {
      await guardDestructiveCommand({
        description: `prisma ${passthroughArgs.join(' ')}`,
        nodeEnv,
        envFile: dotenvFile,
        isProduction,
      })
    }
    const prismaCommand = `prisma ${passthroughArgs.map(shellEscape).join(' ')}`
    runCommand(
      new DotenvCli({
        envFile: dotenvFile,
        execute: prismaCommand,
      }).command
    )
    return
  }

  let mode: PrismaRunMode = maybeMode as PrismaRunMode // e.g., "migrate" or "studio"
  if (!mode)
    mode = await select({
      message: 'Choose an operation for the Prisma CLI to execute:',
      pageSize: 10,
      choices: [
        {
          name: 'Initialize',
          value: 'init',
          description: 'Generates the prisma/schema.prisma file',
        },
        {
          name: 'Generate prisma client',
          value: 'generate',
          description: 'Generates the Prisma Client for interacting with your database',
        },
        {
          name: 'Push changes',
          value: 'push',
          description: concat(
            'Synchronizes Prisma schema with the database',
            "(Doesn't generate migration files)"
          ),
        },
        {
          name: 'Migrate',
          value: 'migrate',
          description: concat(
            'Creates a new migration based on schema changes',
            'and can apply the migration to the database'
          ),
        },
        {
          name: 'Seed',
          value: 'seed',
          description: 'Populates your database with initial data',
        },
        {
          name: 'Deploy',
          value: 'deploy',
          description: concat(
            'Apply all pending migrations to a production database.',
            '(does not create new migration files or run seed scripts automatically)'
          ),
        },
        {
          name: 'Validate',
          value: 'validate',
          description: 'Validates your schema.prisma file',
        },
        {
          name: 'Studio',
          value: 'studio',
          description: 'Opens a web-based interface to view and edit data',
        },
      ],
    })

  let forceReset = false
  let createOnly = true
  let migrationName = ''
  let studioPort = 5555
  switch (mode) {
    case 'push':
      forceReset = await confirm({
        default: false,
        message: concat(
          'Run the force reset command?\n',
          chalk.bold.redBright(
            '🚧🔴 WARNING: this deletes your tables and re-creates them',
            'which causes your data to be deleted!'
          )
        ),
      })
      // A "yes" here is a data wipe — put it behind the same environment-aware safety.
      if (forceReset) {
        await guardDestructiveCommand({
          description: 'prisma db push --force-reset',
          nodeEnv,
          envFile: dotenvFile,
          isProduction,
        })
      }
      break
    case 'migrate':
      createOnly = await confirm({
        default: false,
        message: concat(
          'Would you like to run the generated migration',
          'and apply it to the database automatically?'
        ),
      })
      migrationName = await input({ message: 'Enter migration name' })
      break
    case 'studio':
      studioPort = +(await input({
        default: studioPort.toString(),
        message: 'Port',
      }))
  }

  runCommand(
    new DotenvCli({
      envFile: dotenvFile,
      execute: new Prisma({
        mode,
        forceReset,
        createOnly,
        studioPort,
        migrationName,
      }).command,
    }).command
  )
}
main()
