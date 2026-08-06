import type {
  ActiveOrganizationMembershipPage,
  ActiveOrganizationMembershipView,
} from '../../../application/ports/organization-access.repository'
import type { MembershipRole } from '../../../domain/entities/organization-membership'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class OrganizationMembershipResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiProperty({ format: 'uuid' })
  readonly userId: string

  @ApiProperty({ enum: ['owner', 'admin', 'member'] })
  readonly role: MembershipRole

  @ApiProperty({ format: 'date-time' })
  readonly createdAt: string

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt: string

  constructor(membership: ActiveOrganizationMembershipView) {
    this.id = membership.id
    this.userId = membership.userId
    this.role = membership.role
    this.createdAt = membership.createdAt.toISOString()
    this.updatedAt = membership.updatedAt.toISOString()
  }
}

export class MembershipListResponse {
  @ApiProperty({ type: () => [OrganizationMembershipResponse] })
  readonly memberships: OrganizationMembershipResponse[]

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly nextCursor: string | null

  constructor(page: ActiveOrganizationMembershipPage) {
    this.memberships = page.memberships.map(
      (membership) => new OrganizationMembershipResponse(membership),
    )
    this.nextCursor = page.nextCursor
  }
}
