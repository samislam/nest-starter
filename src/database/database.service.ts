import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@/generated/prisma'
import { Environment } from '@/server/environment-schema'
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ConfigService) config: ConfigService<Environment>) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
