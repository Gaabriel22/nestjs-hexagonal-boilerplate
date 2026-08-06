import type { LoginResult } from '../../../application/use-cases/login'
import { ApiProperty } from '@nestjs/swagger'

class AuthenticatedUserResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string

  @ApiProperty({ format: 'email', example: 'developer@example.com' })
  readonly email!: string
}

export class LoginResponse {
  @ApiProperty({ description: 'Short-lived signed access token' })
  readonly accessToken: string

  @ApiProperty({ description: 'Opaque rotating refresh token' })
  readonly refreshToken: string

  @ApiProperty({ enum: ['Bearer'] })
  readonly tokenType: 'Bearer'

  @ApiProperty({ description: 'Access token lifetime in seconds', example: 900 })
  readonly expiresIn: number

  @ApiProperty({ type: () => AuthenticatedUserResponse })
  readonly user: { readonly id: string; readonly email: string }

  constructor(result: LoginResult) {
    this.accessToken = result.accessToken
    this.refreshToken = result.refreshToken
    this.tokenType = result.tokenType
    this.expiresIn = result.expiresIn
    this.user = result.user
  }
}
