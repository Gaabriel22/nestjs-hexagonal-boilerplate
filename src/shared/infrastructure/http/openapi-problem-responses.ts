import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

import { ProblemDetails } from './problem-details'

export interface OpenApiProblemResponseOptions {
  readonly unauthorized?: boolean
  readonly forbidden?: boolean
  readonly notFound?: boolean
  readonly conflict?: boolean
}

export function ApiStandardProblemResponses(
  options: OpenApiProblemResponseOptions = {},
): MethodDecorator & ClassDecorator {
  const responses = [
    ApiResponse({ status: 400, description: 'Request validation failed', type: ProblemDetails }),
    ApiResponse({
      status: 422,
      description: 'Business rule rejected the request',
      type: ProblemDetails,
    }),
    ApiResponse({ status: 429, description: 'Request rate limit exceeded', type: ProblemDetails }),
    ApiResponse({ status: 500, description: 'Unexpected server error', type: ProblemDetails }),
  ]

  if (options.unauthorized === true) {
    responses.push(
      ApiResponse({ status: 401, description: 'Authentication failed', type: ProblemDetails }),
    )
  }

  if (options.forbidden === true) {
    responses.push(
      ApiResponse({ status: 403, description: 'Permission denied', type: ProblemDetails }),
    )
  }

  if (options.notFound === true) {
    responses.push(
      ApiResponse({ status: 404, description: 'Resource not found', type: ProblemDetails }),
    )
  }

  if (options.conflict === true) {
    responses.push(
      ApiResponse({ status: 409, description: 'Resource state conflict', type: ProblemDetails }),
    )
  }

  return applyDecorators(...responses)
}
