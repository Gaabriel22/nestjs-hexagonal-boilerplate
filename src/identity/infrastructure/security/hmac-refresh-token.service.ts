import { createHmac, randomBytes } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type {
  IssuedRefreshToken,
  RefreshTokenService,
} from '../../application/ports/refresh-token.service'
import type { ApplicationConfig } from '../../../shared/infrastructure/config/environment.schema'

@Injectable()
export class HmacRefreshTokenService implements RefreshTokenService {
  private readonly hashSecret: string
  private readonly ttlMilliseconds: number

  constructor(config: ConfigService<ApplicationConfig, true>) {
    const authentication = config.getOrThrow<ApplicationConfig['authentication']>('authentication')
    this.hashSecret = authentication.refreshTokenHashSecret
    this.ttlMilliseconds = authentication.refreshTokenTtlSeconds * 1_000
  }

  issue(currentTime: Date): IssuedRefreshToken {
    const token = randomBytes(32).toString('base64url')
    const tokenHash = createHmac('sha256', this.hashSecret).update(token).digest('hex')

    return {
      token,
      tokenHash,
      expiresAt: new Date(currentTime.getTime() + this.ttlMilliseconds),
    }
  }
}
