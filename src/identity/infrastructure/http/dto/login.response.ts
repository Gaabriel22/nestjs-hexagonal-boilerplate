import type { LoginResult } from '../../../application/use-cases/login'

export class LoginResponse {
  readonly accessToken: string
  readonly refreshToken: string
  readonly tokenType: 'Bearer'
  readonly expiresIn: number
  readonly user: { readonly id: string; readonly email: string }

  constructor(result: LoginResult) {
    this.accessToken = result.accessToken
    this.refreshToken = result.refreshToken
    this.tokenType = result.tokenType
    this.expiresIn = result.expiresIn
    this.user = result.user
  }
}
