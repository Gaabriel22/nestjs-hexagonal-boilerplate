import { CurrentUserProfileNotFoundError } from '../../../src/users/application/errors/current-user-profile-not-found.error'
import { InvalidDisplayNameError } from '../../../src/users/application/errors/invalid-display-name.error'
import type {
  UserProfile,
  UserProfileRepository,
} from '../../../src/users/application/ports/user-profile.repository'
import { GetCurrentUserProfile } from '../../../src/users/application/use-cases/get-current-user-profile'
import { UpdateCurrentUserProfile } from '../../../src/users/application/use-cases/update-current-user-profile'

const USER_ID = '00000000-0000-4000-8000-000000000701'
const NOW = new Date('2026-01-01T10:00:00.000Z')
const PROFILE: UserProfile = {
  id: USER_ID,
  email: 'profile@example.com',
  displayName: 'Initial Person',
  isActive: true,
  createdAt: new Date('2025-12-01T10:00:00.000Z'),
  updatedAt: NOW,
}

describe('GetCurrentUserProfile', () => {
  it('returns only the application-owned safe projection', async () => {
    const repository = createRepository()
    repository.findActiveById.mockResolvedValue(PROFILE)

    const result = await new GetCurrentUserProfile(repository).execute(USER_ID)

    expect(result).toEqual(PROFILE)
    expect(repository.findActiveById.mock.calls).toEqual([[USER_ID]])
  })

  it('rejects a missing or inactive profile', async () => {
    const repository = createRepository()
    repository.findActiveById.mockResolvedValue(null)

    await expect(new GetCurrentUserProfile(repository).execute(USER_ID)).rejects.toThrow(
      CurrentUserProfileNotFoundError,
    )
  })
})

describe('UpdateCurrentUserProfile', () => {
  it('normalizes and persists the supported display name', async () => {
    const repository = createRepository()
    repository.updateDisplayName.mockResolvedValue({ ...PROFILE, displayName: 'Updated Person' })
    const useCase = new UpdateCurrentUserProfile(repository, { now: (): Date => NOW })

    const result = await useCase.execute(USER_ID, '  Updated   Person  ')

    expect(result.displayName).toBe('Updated Person')
    expect(repository.updateDisplayName.mock.calls).toEqual([[USER_ID, 'Updated Person', NOW]])
  })

  it.each(['', 'x', 'x'.repeat(101), 'Valid\u0000Name'])(
    'rejects invalid display name %j without persistence',
    async (displayName) => {
      const repository = createRepository()
      const useCase = new UpdateCurrentUserProfile(repository, { now: (): Date => NOW })

      await expect(useCase.execute(USER_ID, displayName)).rejects.toThrow(InvalidDisplayNameError)
      expect(repository.updateDisplayName.mock.calls).toHaveLength(0)
    },
  )

  it('rejects update when active profile disappears', async () => {
    const repository = createRepository()
    repository.updateDisplayName.mockResolvedValue(null)

    await expect(
      new UpdateCurrentUserProfile(repository, { now: (): Date => NOW }).execute(
        USER_ID,
        'Updated Person',
      ),
    ).rejects.toThrow(CurrentUserProfileNotFoundError)
  })
})

function createRepository(): jest.Mocked<UserProfileRepository> {
  return {
    findActiveById: jest.fn(),
    updateDisplayName: jest.fn(),
  }
}
