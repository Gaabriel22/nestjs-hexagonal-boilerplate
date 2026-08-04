import { Injectable } from '@nestjs/common'

import type { OrganizationMembership } from '../../../../domain/entities/organization-membership'
import type { MembershipRepository } from '../../../../domain/repositories/membership.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaMembershipMapper } from '../mappers/prisma-membership.mapper'

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
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
}
