import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from '@/modules/users/users.module'
import { DatabaseModule } from './database/database.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { HttpExceptionFilter } from './common/filters/zod.filter'
import { environmentVarsSchema } from '@/server/environment-schema'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod'
import { RequestUserMiddleware } from './middlewares/request-user.middleware'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { RequestPreviewMiddleware } from './middlewares/request-preview.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => environmentVarsSchema.parse(env),
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    DatabaseModule,
    UsersModule,
    // ? uncomment the following lines to enable nodemailer integration automatically
    // MailerModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService<EnvironmentVars>) => ({
    //     transport: {
    //       host: config.getOrThrow('EMAIL_HOST'),
    //       auth: {
    //         user: config.getOrThrow('EMAIL_USERNAME'),
    //         pass: config.getOrThrow('EMAIL_PASSWORD'),
    //       },
    //     },
    //   }),
    // }),
    // ? uncomment the following lines to enable Global context (Nest-CLS) integration automatically
    // ClsModule.forRoot({
    //   middleware: {
    //     mount: true,
    //     setup: setupNestCls,
    //   },
    // }),
  ],
  controllers: [],
  providers: [
    {
      // Protect all routes by default unless a handler is marked public.
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // Validate incoming request payloads and query params using zod DTO schemas.
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      // Normalize zod-based response serialization for routes that use serializer DTOs.
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      // Log and surface zod serialization errors through a shared exception filter.
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestPreviewMiddleware).forRoutes('*')
    consumer.apply(RequestUserMiddleware).forRoutes('*')
  }
}
