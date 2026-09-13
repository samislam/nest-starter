import { ZodError } from 'zod'
import { BaseExceptionFilter } from '@nestjs/core'
import { ZodSerializationException } from 'nestjs-zod'
import { HttpException, ArgumentsHost, Logger, Catch } from '@nestjs/common'

/**
 * Catch-all (NOT `@Catch(HttpException)`): a non-HTTP error thrown inside a request would otherwise
 * skip this filter entirely, so it was never logged with request context. HttpExceptions keep their
 * existing formatting via BaseExceptionFilter.
 *
 * Server-side failures — any non-HTTP error, or a 5xx — are logged here. 4xx client errors (bad
 * input, not found, unauthorized) are expected and would only be noise. This is also the hook point
 * for an error monitor: add `Sentry.captureException(exception)` (or your reporter of choice) next to
 * the log below, and report errors thrown OUTSIDE a request (scheduled jobs) from the monitor's own
 * global uncaught-exception/unhandled-rejection handlers.
 */
@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError()

      if (zodError instanceof ZodError) {
        this.logger.error(`ZodSerializationException: ${zodError.message}`)
      }
    }

    const status = exception instanceof HttpException ? exception.getStatus() : 500
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : `Non-Error thrown: ${String(exception)}`
      )
    }

    super.catch(exception, host)
  }
}
