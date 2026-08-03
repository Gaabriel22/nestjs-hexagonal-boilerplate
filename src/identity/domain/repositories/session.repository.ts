import type { IdentitySession } from '../entities/identity-session'

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY')

export interface SessionRepository {
  save(session: IdentitySession): Promise<void>
  findByIdForUser(id: string, userId: string): Promise<IdentitySession | null>
  findByRefreshTokenHash(refreshTokenHash: string): Promise<IdentitySession | null>
  findActiveByUserId(userId: string, currentTime: Date): Promise<IdentitySession[]>
}
