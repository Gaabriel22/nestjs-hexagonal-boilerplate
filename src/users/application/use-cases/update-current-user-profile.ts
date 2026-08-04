import type { Clock } from '../../../shared/application/ports/clock'
import { CurrentUserProfileNotFoundError } from '../errors/current-user-profile-not-found.error'
import { InvalidDisplayNameError } from '../errors/invalid-display-name.error'
import type { UserProfile, UserProfileRepository } from '../ports/user-profile.repository'

const MIN_DISPLAY_NAME_LENGTH = 2
const MAX_DISPLAY_NAME_LENGTH = 100

export function normalizeDisplayName(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

export class UpdateCurrentUserProfile {
  constructor(
    private readonly repository: UserProfileRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, displayNameInput: string): Promise<UserProfile> {
    const displayName = normalizeDisplayName(displayNameInput)

    if (
      displayName.length < MIN_DISPLAY_NAME_LENGTH ||
      displayName.length > MAX_DISPLAY_NAME_LENGTH ||
      containsControlCharacter(displayName)
    ) {
      throw new InvalidDisplayNameError()
    }

    const profile = await this.repository.updateDisplayName(userId, displayName, this.clock.now())

    if (profile === null) {
      throw new CurrentUserProfileNotFoundError()
    }

    return profile
  }
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0)

    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127)
  })
}
