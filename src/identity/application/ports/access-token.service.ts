export const ACCESS_TOKEN_SERVICE = Symbol('ACCESS_TOKEN_SERVICE')

export interface AccessTokenClaims {
  readonly userId: string
  readonly sessionId: string
}

export interface IssuedAccessToken {
  readonly token: string
  readonly expiresInSeconds: number
}

export interface AccessTokenService {
  issue(claims: AccessTokenClaims): Promise<IssuedAccessToken>
  verify(token: string): Promise<AccessTokenClaims>
}
