import type { UserProfile } from '../../../application/ports/user-profile.repository'

export class UserProfileResponse {
  readonly id: string
  readonly email: string
  readonly displayName: string | null
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string

  constructor(profile: UserProfile) {
    this.id = profile.id
    this.email = profile.email
    this.displayName = profile.displayName
    this.isActive = profile.isActive
    this.createdAt = profile.createdAt.toISOString()
    this.updatedAt = profile.updatedAt.toISOString()
  }
}
