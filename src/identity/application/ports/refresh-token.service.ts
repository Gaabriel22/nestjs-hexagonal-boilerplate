export const REFRESH_TOKEN_SERVICE = Symbol('REFRESH_TOKEN_SERVICE')

export interface IssuedRefreshToken {
  readonly token: string
  readonly tokenHash: string
  readonly expiresAt: Date
}

export interface RefreshTokenService {
  issue(currentTime: Date): IssuedRefreshToken
  hash(token: string): string
}
