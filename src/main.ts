import chalk from 'chalk'
import { AppModule } from './app.module'
import { NestFactory } from '@nestjs/core'
import appConfig from '@/config/app.config'
import { formatUrl } from './utils/formatUrl'
import { ConfigService } from '@nestjs/config'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { VersioningType } from '@nestjs/common'
import { Environment } from './server/environment-schema'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(appConfig.appName)
      .setDescription(appConfig.appDescription)
      .setVersion('1.0')
      .build()
  )

  SwaggerModule.setup(appConfig.apiPrefix, app, cleanupOpenApiDoc(openApiDoc))
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })
  const configService = app.get(ConfigService<Environment, true>)
  const HOST = configService.get('HOST', { infer: true })
  const PORT = configService.get('PORT', { infer: true })
  await app.listen(PORT, HOST, () => {
    const url = formatUrl(HOST, PORT)
    console.log(`\nService listening on ${chalk.bold.underline(url)}\n`)
  })
}
bootstrap()
