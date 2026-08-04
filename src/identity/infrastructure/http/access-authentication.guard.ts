import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'

import { InvalidAccessTokenError } from '../../application/errors/invalid-access-token.error'
import { AuthenticateAccessToken } from '../../application/use-cases/authenticate-access-token'
import type { AuthenticatedRequest } from './request-identity'

@Injectable()
export class AccessAuthenticationGuard implements CanActivate {
  constructor(private readonly authenticateAccessToken: AuthenticateAccessToken) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const [scheme, token, extra] = request.headers.authorization?.split(' ') ?? []

    if (scheme !== 'Bearer' || token === undefined || extra !== undefined) {
      throw new InvalidAccessTokenError()
    }

    request.identity = await this.authenticateAccessToken.execute(token)
    return true
  }
}
