import chalk from 'chalk'
import { AppModule } from './app.module'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import appConfig from '@/config/app.config'
import { formatUrl } from './utils/formatUrl'
import { ConfigService } from '@nestjs/config'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { VersioningType } from '@nestjs/common'
import { Environment, resolveTrustProxy } from './server/environment-schema'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

async function bootstrap() {
  // `rawBody: true` captures the untouched request bytes on `req.rawBody` alongside the parsed body.
  // Required by any webhook whose signature is an HMAC over the raw payload — verifying against the
  // re-serialized parsed body fails on whitespace and key-order differences.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })

  // Express defaults to a 100kb body, which most real apps outgrow (bulk saves, file/JSON imports).
  // Set via Nest's own API rather than importing `express`: express is only a TRANSITIVE dependency
  // here, so `import from 'express'` typechecks and builds but throws MODULE_NOT_FOUND at boot under
  // pnpm's strict node_modules.
  app.useBodyParser('json', { limit: appConfig.bodyLimit })
  app.useBodyParser('urlencoded', { limit: appConfig.bodyLimit, extended: true })

  // The OpenAPI UI/JSON maps the entire API surface (every route + DTO), so it is not served in
  // production — it would hand an anonymous attacker a targeting map (Swagger streams via Express,
  // outside the global JWT guard). Available in every other environment for development.
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    const openApiDoc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(appConfig.appName)
        .setDescription(appConfig.appDescription)
        .setVersion('1.0')
        .build()
    )
    SwaggerModule.setup(appConfig.apiPrefix, app, cleanupOpenApiDoc(openApiDoc))
  }

  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })
  if (appConfig.apiPrefix) app.setGlobalPrefix(appConfig.apiPrefix)
  // Enables OnModuleDestroy hooks (graceful shutdown of pollers, queues, sockets) on SIGINT/SIGTERM.
  app.enableShutdownHooks()

  const configService = app.get(ConfigService<Environment, true>)

  // Where `req.ip` comes from. It is what the rate limiter buckets on, so trusting too few hops makes
  // every client behind nginx share one bucket, and trusting too many lets a caller spoof
  // X-Forwarded-For for a fresh bucket. Defaults to 1 — a single reverse proxy in front.
  app.set('trust proxy', resolveTrustProxy(configService.get('TRUST_PROXY', { infer: true })))

  const HOST = configService.get('HOST', { infer: true })
  const PORT = configService.get('PORT', { infer: true })
  const corsOrigins = configService.get('CORS_ORIGINS', { infer: true })
  const allowAnyOrigin = corsOrigins === 'true'

  // `origin: true` reflects the caller's Origin AND we send credentials — safe in dev, but in
  // production that lets any website make credentialed cross-origin calls. Refuse to boot with the
  // wildcard in production: an explicit comma-separated allow-list is required there.
  if (isProduction && allowAnyOrigin) {
    throw new Error(
      'CORS_ORIGINS must be an explicit allow-list in production — refusing to reflect any origin ("true") while sending credentials.'
    )
  }
  const allowedOrigins = allowAnyOrigin
    ? true
    : corsOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  await app.listen(PORT, HOST, () => {
    const url = formatUrl(HOST, PORT)
    console.log(`\nService listening on ${chalk.bold.underline(url)}\n`)
  })
}
bootstrap()
