import { REF_ERR } from '@/constants'
import { HttpException, HttpStatus } from '@nestjs/common'

export interface ReferenceExceptionResponse {
  statusCode?: number
  message?: string
  errorCode: string
  fields: string[]
}

export class ReferanceHttpException extends HttpException {
  constructor(fields: string[], message = DEFAULT_MESSAGE, statusCode = HttpStatus.BAD_REQUEST) {
    const response: ReferenceExceptionResponse = {
      message: message,
      statusCode: statusCode,
      errorCode: REF_ERR,
      fields,
    }

    super(response, statusCode)
  }
}

const DEFAULT_MESSAGE = 'Incorrect Reference ID!'
