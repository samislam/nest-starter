import { HttpException, HttpStatus } from '@nestjs/common'
import { ACCOUNT_FORZEN, INVALID_CREDENTIALS } from '@/constants'

export interface AuthExceptionResponse {
  statusCode?: number
  message?: string
  errorCode: string
}

export class InvalidCredentialsHttpException extends HttpException {
  constructor(message = 'Invalid credentials', statusCode = HttpStatus.UNAUTHORIZED) {
    const response: AuthExceptionResponse = {
      message,
      statusCode,
      errorCode: INVALID_CREDENTIALS,
    }

    super(response, statusCode)
  }
}

export class AccountForzenHttpException extends HttpException {
  constructor(message = 'Account is frozen', statusCode = HttpStatus.FORBIDDEN) {
    const response: AuthExceptionResponse = {
      message,
      statusCode,
      errorCode: ACCOUNT_FORZEN,
    }

    super(response, statusCode)
  }
}
