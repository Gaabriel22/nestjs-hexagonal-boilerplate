import type { Clock } from '../../../shared/application/ports/clock'
import { InvalidAccessTokenError } from '../errors/invalid-access-token.error'
import type { AccessTokenClaims, AccessTokenService } from '../ports/access-token.service'
import type { AuthenticationRepository } from '../ports/authentication.repository'

export class AuthenticateAccessToken {
  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly repository: AuthenticationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(token: string): Promise<AccessTokenClaims> {
    try {
      const claims = await this.accessTokens.verify(token)
      const identity = await this.repository.findActiveIdentity(
        claims.userId,
        claims.sessionId,
        this.clock.now(),
      )

      if (identity === null) {
        throw new InvalidAccessTokenError()
      }

      return claims
    } catch {
      throw new InvalidAccessTokenError()
    }
  }
}
