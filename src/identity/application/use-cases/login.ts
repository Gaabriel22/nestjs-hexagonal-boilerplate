import { AuditEvent } from '../../../audit/domain/audit-event'
import type { Clock } from '../../../shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../shared/application/ports/identifier-generator'
import { IdentitySession } from '../../domain/entities/identity-session'
import { NormalizedEmail } from '../../domain/value-objects/normalized-email'
import { InvalidCredentialsError } from '../errors/invalid-credentials.error'
import type { AccessTokenService } from '../ports/access-token.service'
import type { AuthenticationRepository } from '../ports/authentication.repository'
import type { CredentialAuthenticator } from '../ports/credential-authenticator'
import type { RefreshTokenService } from '../ports/refresh-token.service'

export interface LoginCommand {
  readonly email: string
  readonly password: string
}

export interface LoginResult {
  readonly accessToken: string
  readonly refreshToken: string
  readonly tokenType: 'Bearer'
  readonly expiresIn: number
  readonly user: { readonly id: string; readonly email: string }
}

export class Login {
  constructor(
    private readonly repository: AuthenticationRepository,
    private readonly credentialAuthenticator: CredentialAuthenticator,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly identifiers: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const normalizedEmail = NormalizedEmail.create(command.email).value
    const identity = await this.repository.findCredentialIdentity(normalizedEmail)
    const matches = await this.credentialAuthenticator.matches(
      command.password,
      identity?.passwordHash ?? null,
    )

    if (identity === null || !identity.isActive || !matches) {
      throw new InvalidCredentialsError()
    }

    const currentTime = this.clock.now()
    const sessionId = this.identifiers.generate()
    const refreshToken = this.refreshTokens.issue(currentTime)
    const accessToken = await this.accessTokens.issue({ userId: identity.userId, sessionId })

    const session = IdentitySession.create({
      id: sessionId,
      userId: identity.userId,
      refreshTokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      currentTime,
    })

    await this.repository.createSession(
      session,
      AuditEvent.create({
        id: this.identifiers.generate(),
        actorUserId: identity.userId,
        action: 'identity.session_created',
        targetType: 'session',
        targetId: session.id,
        occurredAt: currentTime,
      }),
    )

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresInSeconds,
      user: { id: identity.userId, email: identity.normalizedEmail },
    }
  }
}
