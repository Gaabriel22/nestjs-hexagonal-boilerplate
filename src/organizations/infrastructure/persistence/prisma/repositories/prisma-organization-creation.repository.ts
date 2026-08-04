import { Injectable } from '@nestjs/common'

import type { OrganizationCreationRepository } from '../../../../application/ports/organization-creation.repository'
import type { Organization } from '../../../../domain/entities/organization'
import type { OrganizationMembership } from '../../../../domain/entities/organization-membership'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaMembershipMapper } from '../mappers/prisma-membership.mapper'
import { PrismaOrganizationMapper } from '../mappers/prisma-organization.mapper'

@Injectable()
export class PrismaOrganizationCreationRepository implements OrganizationCreationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(
    organization: Organization,
    ownerMembership: OrganizationMembership,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.organization.create({
        data: PrismaOrganizationMapper.toPersistence(organization),
      })
      await transaction.membership.create({
        data: PrismaMembershipMapper.toPersistence(ownerMembership),
      })
    })
  }
}
