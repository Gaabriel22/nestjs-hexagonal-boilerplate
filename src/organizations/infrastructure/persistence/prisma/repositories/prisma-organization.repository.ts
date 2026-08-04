import { Injectable } from '@nestjs/common'

import type { Organization } from '../../../../domain/entities/organization'
import type { OrganizationRepository } from '../../../../domain/repositories/organization.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaOrganizationMapper } from '../mappers/prisma-organization.mapper'

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(organization: Organization): Promise<void> {
    const data = PrismaOrganizationMapper.toPersistence(organization)

    await this.prisma.organization.upsert({
      where: { id: organization.id },
      create: data,
      update: {
        name: data.name,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findById(id: string): Promise<Organization | null> {
    const record = await this.prisma.organization.findUnique({ where: { id } })

    return record === null ? null : PrismaOrganizationMapper.toDomain(record)
  }
}
