import type {
  Organization as PrismaOrganization,
  Prisma,
} from '../../../../../generated/prisma/client'
import { Organization } from '../../../../domain/entities/organization'

export class PrismaOrganizationMapper {
  static toDomain(record: PrismaOrganization): Organization {
    return Organization.restore(record)
  }

  static toPersistence(organization: Organization): Prisma.OrganizationUncheckedCreateInput {
    return {
      id: organization.id,
      name: organization.name,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    }
  }
}
