import type { CreateOrganizationResult } from '../../../application/use-cases/create-organization'

export class CreatedOwnerMembershipResponse {
  readonly id: string
  readonly organizationId: string
  readonly userId: string
  readonly role: 'owner'
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string

  constructor(result: CreateOrganizationResult['ownerMembership']) {
    this.id = result.id
    this.organizationId = result.organizationId
    this.userId = result.userId
    this.role = result.role
    this.isActive = result.isActive
    this.createdAt = result.createdAt.toISOString()
    this.updatedAt = result.updatedAt.toISOString()
  }
}

export class CreatedOrganizationResponse {
  readonly id: string
  readonly name: string
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string
  readonly ownerMembership: CreatedOwnerMembershipResponse

  constructor(result: CreateOrganizationResult) {
    this.id = result.id
    this.name = result.name
    this.isActive = result.isActive
    this.createdAt = result.createdAt.toISOString()
    this.updatedAt = result.updatedAt.toISOString()
    this.ownerMembership = new CreatedOwnerMembershipResponse(result.ownerMembership)
  }
}
