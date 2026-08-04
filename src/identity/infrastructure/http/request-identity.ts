import type { FastifyRequest } from 'fastify'

import type { AccessTokenClaims } from '../../application/ports/access-token.service'

export interface AuthenticatedRequest extends FastifyRequest {
  identity?: AccessTokenClaims
}
