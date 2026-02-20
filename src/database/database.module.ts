import { ConfigModule } from '@nestjs/config'
import { Global, Module } from '@nestjs/common'
import { DatabaseService } from './database.service'

@Global() // optional: makes it auto-available everywhere
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
