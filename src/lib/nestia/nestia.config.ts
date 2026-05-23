import { NestFactory } from '@nestjs/core'
import { INestiaConfig } from '@nestia/sdk'
import { AppModule } from '../../app.module'
import { VersioningType } from '@nestjs/common'
import appConfig from '../../config/app.config'

const NESTIA_CONFIG: INestiaConfig = {
  clone: true,
  output: 'src/generated/nestia',
  swagger: {
    beautify: 2,
    output: 'dist/swagger.json',
  },
  input: async () => {
    process.env.SKIP_DATABASE_CONNECT ??= 'true'

    const app = await NestFactory.create(AppModule, {
      logger: false,
    })

    if (appConfig.apiPrefix) app.setGlobalPrefix(appConfig.apiPrefix)
    app.enableVersioning({
      defaultVersion: '1',
      type: VersioningType.URI,
    })
    return app
  },
}

export default NESTIA_CONFIG
