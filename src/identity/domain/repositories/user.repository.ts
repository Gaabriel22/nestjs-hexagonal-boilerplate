import type { IdentityUser } from '../entities/identity-user'

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

export interface UserRepository {
  save(user: IdentityUser): Promise<void>
  findById(id: string): Promise<IdentityUser | null>
  findByNormalizedEmail(normalizedEmail: string): Promise<IdentityUser | null>
}
