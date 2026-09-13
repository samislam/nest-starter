import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@/generated/prisma'
import { Environment } from '@/server/environment-schema'
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  private readonly skipDatabaseConnect: boolean
  private readonly databaseUrl: string
  private readonly isProduction: boolean

  constructor(@Inject(ConfigService) config: ConfigService<Environment>) {
    super({
      omit: {
        user: {
          passwordHash: true,
        },
      },
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    })

    this.databaseUrl = config.get('DATABASE_URL') ?? ''
    this.isProduction = process.env.NODE_ENV === 'production'
    this.skipDatabaseConnect =
      config.get('SKIP_DATABASE_CONNECT', {
        infer: true,
      }) ?? false
  }

  async onModuleInit() {
    if (this.skipDatabaseConnect) return

    try {
      await this.$connect()
    } catch (error) {
      // Prisma's own failure is a wall of minified engine source, which buries the one line that
      // matters. Print the cause and the fix instead.
      this.logger.error(this.describeConnectionFailure(error))

      // In production a database-less API must not pretend to be healthy: it would answer requests
      // and fail every one of them, and a load balancer would happily route traffic to it. Abort.
      if (this.isProduction) throw error

      // In development, keep booting. An unconfigured machine can still start the server, read the
      // OpenAPI docs and exercise the routes that don't touch the database — and the error above says
      // exactly what to run. Only DB-backed requests fail, each with its own error.
      this.logger.warn('Continuing without a database connection (development only).')
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /** A short, actionable message for the handful of ways a first connection actually fails. */
  private describeConnectionFailure(error: unknown): string {
    const code = (error as { errorCode?: string })?.errorCode
    const target = this.safeTarget()
    const hint =
      code === 'P1003'
        ? `The database does not exist yet. Create it and apply the schema:\n` +
          `    createdb ${target.name}\n` +
          `    pnpm run setup`
        : code === 'P1000'
          ? `Authentication failed. Set DATABASE_URL in .env.development with credentials that work on this machine.`
          : code === 'P1001'
            ? `No server is listening at ${target.host}. Start PostgreSQL, or point DATABASE_URL somewhere else.`
            : `Set DATABASE_URL in .env.development, or run with SKIP_DATABASE_CONNECT=true to boot without one.`

    return (
      `Could not connect to the database (${target.host}/${target.name}${code ? `, ${code}` : ''}).\n` +
      `  ${hint}`
    )
  }

  /** Host + database name from DATABASE_URL, never the password. */
  private safeTarget(): { host: string; name: string } {
    try {
      const parsed = new URL(this.databaseUrl)
      return { host: parsed.host, name: parsed.pathname.replace(/^\//, '').split('?')[0] }
    } catch {
      return { host: 'unknown host', name: 'unknown database' }
    }
  }
}
