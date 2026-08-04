import type { Clock } from '../../../shared/application/ports/clock'
import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token.error'
import type { AccessTokenService } from '../ports/access-token.service'
import type { RefreshTokenService } from '../ports/refresh-token.service'
import type { SessionManagementRepository } from '../ports/session-management.repository'

export interface RefreshSessionResult {
  readonly accessToken: string
  readonly refreshToken: string
  readonly tokenType: 'Bearer'
  readonly expiresIn: number
}

export class RefreshSession {
  constructor(
    private readonly repository: SessionManagementRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly clock: Clock,
  ) {}

  async execute(refreshToken: string): Promise<RefreshSessionResult> {
    const currentTime = this.clock.now()
    const replacement = this.refreshTokens.issue(currentTime)
    const rotation = await this.repository.rotateRefreshToken({
      presentedTokenHash: this.refreshTokens.hash(refreshToken),
      replacementTokenHash: replacement.tokenHash,
      replacementExpiresAt: replacement.expiresAt,
      currentTime,
    })

    if (rotation.outcome !== 'rotated') {
      throw new InvalidRefreshTokenError()
    }

    const accessToken = await this.accessTokens.issue({
      userId: rotation.userId,
      sessionId: rotation.sessionId,
    })

    return {
      accessToken: accessToken.token,
      refreshToken: replacement.token,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresInSeconds,
    }
  }
}
