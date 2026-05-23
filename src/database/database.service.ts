import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@/generated/prisma'
import { Environment } from '@/server/environment-schema'
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly skipDatabaseConnect: boolean
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

    this.skipDatabaseConnect =
      config.get('SKIP_DATABASE_CONNECT', {
        infer: true,
      }) ?? false
  }

  async onModuleInit() {
    if (this.skipDatabaseConnect) return
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
