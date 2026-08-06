import type { CreateOrganizationResult } from '../../../application/use-cases/create-organization'
import { ApiProperty } from '@nestjs/swagger'

export class CreatedOwnerMembershipResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiProperty({ format: 'uuid' })
  readonly organizationId: string

  @ApiProperty({ format: 'uuid' })
  readonly userId: string

  @ApiProperty({ enum: ['owner'] })
  readonly role: 'owner'

  @ApiProperty({ example: true })
  readonly isActive: boolean

  @ApiProperty({ format: 'date-time' })
  readonly createdAt: string

  @ApiProperty({ format: 'date-time' })
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
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiProperty({ example: 'Acme Engineering' })
  readonly name: string

  @ApiProperty({ example: true })
  readonly isActive: boolean

  @ApiProperty({ format: 'date-time' })
  readonly createdAt: string

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt: string

  @ApiProperty({ type: () => CreatedOwnerMembershipResponse })
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
