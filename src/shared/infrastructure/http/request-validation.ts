import { BadRequestException } from '@nestjs/common'
import type { ValidationError } from 'class-validator'

import type { ValidationProblemField } from './problem-details'

interface ValidationExceptionResponse {
  readonly code: 'request.validation_failed'
  readonly detail: string
  readonly errors: readonly ValidationProblemField[]
}

function flattenValidationErrors(
  errors: readonly ValidationError[],
  parentPath = '',
): ValidationProblemField[] {
  return errors.flatMap((error) => {
    const field = parentPath === '' ? error.property : `${parentPath}.${error.property}`
    const messages = Object.values(error.constraints ?? {})
    const currentError = messages.length === 0 ? [] : [{ field, messages }]

    return [...currentError, ...flattenValidationErrors(error.children ?? [], field)]
  })
}

export function createValidationException(errors: readonly ValidationError[]): BadRequestException {
  const response: ValidationExceptionResponse = {
    code: 'request.validation_failed',
    detail: 'Request validation failed',
    errors: flattenValidationErrors(errors),
  }

  return new BadRequestException(response)
}
