import type { OrganizationCreationRepository } from '../../../src/organizations/application/ports/organization-creation.repository'
import { CreateOrganization } from '../../../src/organizations/application/use-cases/create-organization'
import { Organization } from '../../../src/organizations/domain/entities/organization'
import { OrganizationMembership } from '../../../src/organizations/domain/entities/organization-membership'
import { InvalidOrganizationNameError } from '../../../src/organizations/domain/errors/invalid-organization-name.error'

const USER_ID = '00000000-0000-4000-8000-000000001001'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001002'
const MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001003'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('organization domain', () => {
  it('normalizes organization name and creates an active owner membership', () => {
    const organization = Organization.create({
      id: ORGANIZATION_ID,
      name: '  Example   Company  ',
      currentTime: NOW,
    })
    const membership = OrganizationMembership.createOwner({
      id: MEMBERSHIP_ID,
      organizationId: organization.id,
      userId: USER_ID,
      currentTime: NOW,
    })

    expect(organization).toMatchObject({
      id: ORGANIZATION_ID,
      name: 'Example Company',
      isActive: true,
    })
    expect(membership).toMatchObject({
      id: MEMBERSHIP_ID,
      organizationId: ORGANIZATION_ID,
      userId: USER_ID,
      role: 'owner',
      isActive: true,
    })
  })

  it.each(['', 'x', 'x'.repeat(121)])('rejects invalid organization name %j', (name) => {
    expect(() => Organization.create({ id: ORGANIZATION_ID, name, currentTime: NOW })).toThrow(
      InvalidOrganizationNameError,
    )
  })
})

describe('CreateOrganization', () => {
  it('persists organization and owner through one atomic repository operation', async () => {
    const repository = createRepository()
    const identifiers = [ORGANIZATION_ID, MEMBERSHIP_ID]
    const useCase = new CreateOrganization(
      repository,
      { generate: (): string => identifiers.shift() ?? 'unexpected-id' },
      { now: (): Date => NOW },
    )

    const result = await useCase.execute({
      actorUserId: USER_ID,
      name: 'Example Company',
    })

    expect(result).toMatchObject({
      id: ORGANIZATION_ID,
      name: 'Example Company',
      isActive: true,
      ownerMembership: {
        id: MEMBERSHIP_ID,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: 'owner',
        isActive: true,
      },
    })
    const [organization, ownerMembership] = repository.createWithOwner.mock.calls[0] ?? []
    expect(organization).toMatchObject({ id: ORGANIZATION_ID, name: 'Example Company' })
    expect(ownerMembership).toMatchObject({
      id: MEMBERSHIP_ID,
      organizationId: ORGANIZATION_ID,
      userId: USER_ID,
      role: 'owner',
    })
  })

  it('does not return success when atomic persistence fails', async () => {
    const repository = createRepository()
    repository.createWithOwner.mockRejectedValue(new Error('transaction failed'))
    const identifiers = [ORGANIZATION_ID, MEMBERSHIP_ID]
    const useCase = new CreateOrganization(
      repository,
      { generate: (): string => identifiers.shift() ?? 'unexpected-id' },
      { now: (): Date => NOW },
    )

    await expect(
      useCase.execute({ actorUserId: USER_ID, name: 'Example Company' }),
    ).rejects.toThrow('transaction failed')
  })
})

function createRepository(): jest.Mocked<OrganizationCreationRepository> {
  return { createWithOwner: jest.fn().mockResolvedValue(undefined) }
}
