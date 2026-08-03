import type { Credential } from '../entities/credential'

export const CREDENTIAL_REPOSITORY = Symbol('CREDENTIAL_REPOSITORY')

export interface CredentialRepository {
  save(credential: Credential): Promise<void>
  findByUserId(userId: string): Promise<Credential | null>
}
