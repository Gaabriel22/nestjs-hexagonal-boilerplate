import type { AuditContext } from '../../../audit/application/audit-context'

export const SESSION_MANAGEMENT_REPOSITORY = Symbol('SESSION_MANAGEMENT_REPOSITORY')

export interface RotateRefreshTokenInput {
  readonly presentedTokenHash: string
  readonly replacementTokenHash: string
  readonly replacementExpiresAt: Date
  readonly currentTime: Date
  readonly audit: AuditContext
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

export interface RevokeOwnedSessionInput {
  readonly userId: string
  readonly sessionId: string
  readonly currentTime: Date
  readonly reason: 'logout' | 'user_revocation'
  readonly audit: AuditContext
}

export interface SessionManagementRepository {
  rotateRefreshToken(input: RotateRefreshTokenInput): Promise<RotateRefreshTokenResult>
  revokeOwnedSession(input: RevokeOwnedSessionInput): Promise<void>
  findActiveSessions(userId: string, currentTime: Date): Promise<ActiveSessionView[]>
}
