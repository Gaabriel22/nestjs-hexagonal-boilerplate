export const SESSION_MANAGEMENT_REPOSITORY = Symbol('SESSION_MANAGEMENT_REPOSITORY')

export interface RotateRefreshTokenInput {
  readonly presentedTokenHash: string
  readonly replacementTokenHash: string
  readonly replacementExpiresAt: Date
  readonly currentTime: Date
}

export type RotateRefreshTokenResult =
  | { readonly outcome: 'rotated'; readonly userId: string; readonly sessionId: string }
  | { readonly outcome: 'reused' }
  | { readonly outcome: 'invalid' }

export interface ActiveSessionView {
  readonly id: string
  readonly deviceLabel: string | null
  readonly lastActivityAt: Date
  readonly expiresAt: Date
  readonly createdAt: Date
}

export interface SessionManagementRepository {
  rotateRefreshToken(input: RotateRefreshTokenInput): Promise<RotateRefreshTokenResult>
  revokeOwnedSession(userId: string, sessionId: string, currentTime: Date): Promise<void>
  findActiveSessions(userId: string, currentTime: Date): Promise<ActiveSessionView[]>
}
