import type { Membership as PrismaMembership, Prisma } from '../../../../../generated/prisma/client'
import { OrganizationMembership } from '../../../../domain/entities/organization-membership'

export class PrismaMembershipMapper {
  static toDomain(record: PrismaMembership): OrganizationMembership {
    return OrganizationMembership.restore(record)
  }

  static toPersistence(membership: OrganizationMembership): Prisma.MembershipUncheckedCreateInput {
    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      isActive: membership.isActive,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    }
  }
}
