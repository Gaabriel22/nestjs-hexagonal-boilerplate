import type { Credential } from '../../domain/entities/credential'
import type { IdentityUser } from '../../domain/entities/identity-user'

export const REGISTRATION_REPOSITORY = Symbol('REGISTRATION_REPOSITORY')

export type RegistrationPersistenceResult = 'created' | 'email_conflict'

export interface RegistrationRepository {
  createUserWithCredential(
    user: IdentityUser,
    credential: Credential,
  ): Promise<RegistrationPersistenceResult>
}
