import type { RefreshSessionResult } from '../../../application/use-cases/refresh-session'
import { ApiProperty } from '@nestjs/swagger'

export class RefreshSessionResponse {
  @ApiProperty({ description: 'New short-lived signed access token' })
  readonly accessToken: string

  @ApiProperty({ description: 'New opaque rotating refresh token' })
  readonly refreshToken: string

  @ApiProperty({ enum: ['Bearer'] })
  readonly tokenType: 'Bearer'

  @ApiProperty({ description: 'Access token lifetime in seconds', example: 900 })
  readonly expiresIn: number

  constructor(result: RefreshSessionResult) {
    this.accessToken = result.accessToken
    this.refreshToken = result.refreshToken
    this.tokenType = result.tokenType
    this.expiresIn = result.expiresIn
  }
}
