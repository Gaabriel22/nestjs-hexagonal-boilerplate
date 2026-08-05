import { Injectable } from '@nestjs/common'

import type {
  ActiveOrganizationMembershipPage,
  ListActiveOrganizationMembershipsInput,
  OrganizationAccessRepository,
  OrganizationMembershipAuthorizationView,
} from '../../../../application/ports/organization-access.repository'
import type { OrganizationMembership } from '../../../../domain/entities/organization-membership'
import type { MembershipRepository } from '../../../../domain/repositories/membership.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaMembershipMapper } from '../mappers/prisma-membership.mapper'

@Injectable()
export class PrismaMembershipRepository
  implements MembershipRepository, OrganizationAccessRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async save(membership: OrganizationMembership): Promise<void> {
    const data = PrismaMembershipMapper.toPersistence(membership)

    await this.prisma.membership.upsert({
      where: { id: membership.id },
      create: data,
      update: {
        role: data.role,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findByIdForOrganization(
    id: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    const record = await this.prisma.membership.findFirst({ where: { id, organizationId } })

    return record === null ? null : PrismaMembershipMapper.toDomain(record)
  }

  findMembershipForAuthorization(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembershipAuthorizationView | null> {
    return this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true, isActive: true },
    })
  }

  async listActiveMemberships(
    input: ListActiveOrganizationMembershipsInput,
  ): Promise<ActiveOrganizationMembershipPage> {
    const records = await this.prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        isActive: true,
        id: input.cursor === undefined ? undefined : { gt: input.cursor },
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
      take: input.limit + 1,
    })
    const hasNextPage = records.length > input.limit
    const memberships = hasNextPage ? records.slice(0, input.limit) : records

    return {
      memberships,
      nextCursor: hasNextPage ? (memberships.at(-1)?.id ?? null) : null,
    }
  }
}
