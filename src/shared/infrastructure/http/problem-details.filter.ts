import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { ApplicationError } from '../../application/errors/application.error'
import { DomainError } from '../../domain/errors/domain.error'
import type { ProblemDetails, ValidationProblemField } from './problem-details'

interface HttpExceptionPayload {
  readonly code?: unknown
  readonly detail?: unknown
  readonly message?: unknown
  readonly errors?: unknown
}

interface ErrorDescriptor {
  readonly status: number
  readonly code: string
  readonly detail: string
  readonly errors?: readonly ValidationProblemField[]
}

const APPLICATION_STATUS: Readonly<Record<ApplicationError['category'], number>> = {
  bad_request: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  unprocessable: HttpStatus.UNPROCESSABLE_ENTITY,
}

const STATUS_TITLES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
}

const STATUS_CODES: Readonly<Record<number, string>> = {
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'request.payload_too_large',
}

function isValidationProblemFields(value: unknown): value is readonly ValidationProblemField[] {
  if (!Array.isArray(value)) {
    return false
  }

  return (value as unknown[]).every((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      return false
    }

    const candidate = item as Record<string, unknown>
    const messages = candidate.messages

    return (
      typeof candidate.field === 'string' &&
      Array.isArray(messages) &&
      (messages as unknown[]).every((message: unknown) => typeof message === 'string')
    )
  })
}

function describeHttpException(exception: HttpException): ErrorDescriptor {
  const status = exception.getStatus()
  const response = exception.getResponse()
  const payload: HttpExceptionPayload =
    typeof response === 'object' && response !== null ? response : { message: response }
  const responseMessage = payload.detail ?? payload.message
  const detail =
    typeof responseMessage === 'string'
      ? responseMessage
      : status >= 500
        ? 'An unexpected error occurred'
        : (STATUS_TITLES[status] ?? 'Request failed')
  const code =
    typeof payload.code === 'string' ? payload.code : (STATUS_CODES[status] ?? `http.${status}`)

  return {
    status,
    code,
    detail,
    errors: isValidationProblemFields(payload.errors) ? payload.errors : undefined,
  }
}

function describeException(exception: unknown): ErrorDescriptor {
  if (exception instanceof ApplicationError) {
    return {
      status: APPLICATION_STATUS[exception.category],
      code: exception.code,
      detail: exception.message,
    }
  }

  if (exception instanceof DomainError) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: exception.code,
      detail: exception.message,
    }
  }

  if (exception instanceof HttpException) {
    return describeHttpException(exception)
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'internal.unexpected_error',
    detail: 'An unexpected error occurred',
  }
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<FastifyRequest>()
    const reply = http.getResponse<FastifyReply>()
    const descriptor = describeException(exception)

    if (descriptor.status >= 500) {
      this.logger.error(
        'Unhandled request exception',
        exception instanceof Error ? exception.stack : undefined,
      )
    }

    const problem: ProblemDetails = {
      type: `urn:problem:${descriptor.code}`,
      title: STATUS_TITLES[descriptor.status] ?? 'Request Failed',
      status: descriptor.status,
      detail: descriptor.detail,
      instance: request.url,
      code: descriptor.code,
      requestId: request.id,
      errors: descriptor.errors,
    }

    void reply.status(descriptor.status).send(problem)
  }
}
