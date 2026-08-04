import type { IdentitySession } from '../../domain/entities/identity-session'

export const AUTHENTICATION_REPOSITORY = Symbol('AUTHENTICATION_REPOSITORY')

export interface CredentialIdentity {
  readonly userId: string
  readonly normalizedEmail: string
  readonly isActive: boolean
  readonly passwordHash: string
}

export interface ActiveIdentity {
  readonly userId: string
  readonly sessionId: string
}

export interface AuthenticationRepository {
  findCredentialIdentity(normalizedEmail: string): Promise<CredentialIdentity | null>
  createSession(session: IdentitySession): Promise<void>
  findActiveIdentity(
    userId: string,
    sessionId: string,
    currentTime: Date,
  ): Promise<ActiveIdentity | null>
}
