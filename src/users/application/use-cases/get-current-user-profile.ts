import { CurrentUserProfileNotFoundError } from '../errors/current-user-profile-not-found.error'
import type { UserProfile, UserProfileRepository } from '../ports/user-profile.repository'

export class GetCurrentUserProfile {
  constructor(private readonly repository: UserProfileRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    const profile = await this.repository.findActiveById(userId)

    if (profile === null) {
      throw new CurrentUserProfileNotFoundError()
    }

    return profile
  }
}
