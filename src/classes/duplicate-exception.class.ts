import { DUPLICATE_ERR } from '@/constants'
import { HttpException, HttpStatus } from '@nestjs/common'

export interface DuplicateExceptionResponse {
  statusCode?: number
  message?: string
  errorCode: string
  fields: string[]
}

export class DuplicateHttpException extends HttpException {
  constructor(fields: string[], message = DEFAULT_MESSAGE, statusCode = HttpStatus.BAD_REQUEST) {
    const response: DuplicateExceptionResponse = {
      message: message,
      statusCode: statusCode,
      errorCode: DUPLICATE_ERR,
      fields,
    }

    super(response, statusCode)
  }
}

const DEFAULT_MESSAGE = 'Duplicate Entry!'
