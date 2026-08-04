export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY')

export interface UserProfile {
  readonly id: string
  readonly email: string
  readonly displayName: string | null
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface UserProfileRepository {
  findActiveById(userId: string): Promise<UserProfile | null>
  updateDisplayName(
    userId: string,
    displayName: string,
    updatedAt: Date,
  ): Promise<UserProfile | null>
}
