import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@/generated/prisma'
import { EnvironmentVars } from '@/types/environment-vars'
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService<EnvironmentVars>) {
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
