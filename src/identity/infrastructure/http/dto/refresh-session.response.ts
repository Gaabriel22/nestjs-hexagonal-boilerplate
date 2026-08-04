import type { RefreshSessionResult } from '../../../application/use-cases/refresh-session'

export class RefreshSessionResponse {
  readonly accessToken: string
  readonly refreshToken: string
  readonly tokenType: 'Bearer'
  readonly expiresIn: number

  constructor(result: RefreshSessionResult) {
    this.accessToken = result.accessToken
    this.refreshToken = result.refreshToken
    this.tokenType = result.tokenType
    this.expiresIn = result.expiresIn
  }
}
