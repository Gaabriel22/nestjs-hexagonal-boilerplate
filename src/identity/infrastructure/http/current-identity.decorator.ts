import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { AccessTokenClaims } from '../../application/ports/access-token.service'
import type { AuthenticatedRequest } from './request-identity'

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenClaims => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (request.identity === undefined) {
      throw new Error('Authenticated request identity is missing')
    }

    return request.identity
  },
)
