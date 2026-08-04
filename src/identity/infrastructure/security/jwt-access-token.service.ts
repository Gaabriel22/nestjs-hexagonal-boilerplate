import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import type {
  AccessTokenClaims,
  AccessTokenService,
  IssuedAccessToken,
} from '../../application/ports/access-token.service'
import type { ApplicationConfig } from '../../../shared/infrastructure/config/environment.schema'

const TOKEN_ISSUER = 'nestjs-hexagonal-boilerplate'
const TOKEN_AUDIENCE = 'nestjs-hexagonal-boilerplate-users'

interface JwtPayload {
  readonly sub?: unknown
  readonly sid?: unknown
}

@Injectable()
export class JwtAccessTokenService implements AccessTokenService {
  private readonly secret: string
  private readonly expiresInSeconds: number

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<ApplicationConfig, true>,
  ) {
    const authentication = config.getOrThrow<ApplicationConfig['authentication']>('authentication')
    this.secret = authentication.accessTokenSecret
    this.expiresInSeconds = authentication.accessTokenTtlSeconds
  }

  async issue(claims: AccessTokenClaims): Promise<IssuedAccessToken> {
    const token = await this.jwt.signAsync(
      { sid: claims.sessionId },
      {
        subject: claims.userId,
        secret: this.secret,
        expiresIn: this.expiresInSeconds,
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      },
    )

    return { token, expiresInSeconds: this.expiresInSeconds }
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.secret,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    })

    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new Error('Invalid access token claims')
    }

    return { userId: payload.sub, sessionId: payload.sid }
  }
}
