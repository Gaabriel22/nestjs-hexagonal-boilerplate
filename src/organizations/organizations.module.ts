import { Module } from '@nestjs/common'

import { IdentityModule } from '../identity/identity.module'
import { CLOCK, type Clock } from '../shared/application/ports/clock'
import {
  IDENTIFIER_GENERATOR,
  type IdentifierGenerator,
} from '../shared/application/ports/identifier-generator'
import { CryptoIdentifierGenerator } from '../shared/infrastructure/system/crypto-identifier-generator'
import { SystemClock } from '../shared/infrastructure/system/system-clock'
import {
  MEMBERSHIP_ADMINISTRATION_REPOSITORY,
  type MembershipAdministrationRepository,
} from './application/ports/membership-administration.repository'
import {
  ORGANIZATION_CREATION_REPOSITORY,
  type OrganizationCreationRepository,
} from './application/ports/organization-creation.repository'
import {
  ORGANIZATION_ACCESS_REPOSITORY,
  type OrganizationAccessRepository,
} from './application/ports/organization-access.repository'
import { ChangeOrganizationMembershipRole } from './application/use-cases/change-organization-membership-role'
import { CreateOrganization } from './application/use-cases/create-organization'
import { ListOrganizationMemberships } from './application/use-cases/list-organization-memberships'
import { RemoveOrganizationMembership } from './application/use-cases/remove-organization-membership'
import { MEMBERSHIP_REPOSITORY } from './domain/repositories/membership.repository'
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository'
import { OrganizationsController } from './infrastructure/http/organizations.controller'
import { OrganizationPermissionGuard } from './infrastructure/http/organization-permission.guard'
import { PrismaMembershipRepository } from './infrastructure/persistence/prisma/repositories/prisma-membership.repository'
import { PrismaOrganizationCreationRepository } from './infrastructure/persistence/prisma/repositories/prisma-organization-creation.repository'
import { PrismaOrganizationRepository } from './infrastructure/persistence/prisma/repositories/prisma-organization.repository'

@Module({
  imports: [IdentityModule],
  controllers: [OrganizationsController],
  providers: [
    PrismaOrganizationRepository,
    PrismaMembershipRepository,
    PrismaOrganizationCreationRepository,
    OrganizationPermissionGuard,
    CryptoIdentifierGenerator,
    SystemClock,
    { provide: ORGANIZATION_REPOSITORY, useExisting: PrismaOrganizationRepository },
    { provide: MEMBERSHIP_REPOSITORY, useExisting: PrismaMembershipRepository },
    { provide: ORGANIZATION_ACCESS_REPOSITORY, useExisting: PrismaMembershipRepository },
    { provide: MEMBERSHIP_ADMINISTRATION_REPOSITORY, useExisting: PrismaMembershipRepository },
    {
      provide: ORGANIZATION_CREATION_REPOSITORY,
      useExisting: PrismaOrganizationCreationRepository,
    },
    { provide: IDENTIFIER_GENERATOR, useExisting: CryptoIdentifierGenerator },
    { provide: CLOCK, useExisting: SystemClock },
    {
      provide: CreateOrganization,
      inject: [ORGANIZATION_CREATION_REPOSITORY, IDENTIFIER_GENERATOR, CLOCK],
      useFactory: (
        repository: OrganizationCreationRepository,
        identifiers: IdentifierGenerator,
        clock: Clock,
      ): CreateOrganization => new CreateOrganization(repository, identifiers, clock),
    },
    {
      provide: ListOrganizationMemberships,
      inject: [ORGANIZATION_ACCESS_REPOSITORY],
      useFactory: (repository: OrganizationAccessRepository): ListOrganizationMemberships =>
        new ListOrganizationMemberships(repository),
    },
    {
      provide: ChangeOrganizationMembershipRole,
      inject: [MEMBERSHIP_ADMINISTRATION_REPOSITORY, CLOCK, IDENTIFIER_GENERATOR],
      useFactory: (
        repository: MembershipAdministrationRepository,
        clock: Clock,
        identifiers: IdentifierGenerator,
      ): ChangeOrganizationMembershipRole =>
        new ChangeOrganizationMembershipRole(repository, clock, identifiers),
    },
    {
      provide: RemoveOrganizationMembership,
      inject: [MEMBERSHIP_ADMINISTRATION_REPOSITORY, CLOCK, IDENTIFIER_GENERATOR],
      useFactory: (
        repository: MembershipAdministrationRepository,
        clock: Clock,
        identifiers: IdentifierGenerator,
      ): RemoveOrganizationMembership =>
        new RemoveOrganizationMembership(repository, clock, identifiers),
    },
  ],
  exports: [
    ORGANIZATION_REPOSITORY,
    MEMBERSHIP_REPOSITORY,
    ORGANIZATION_ACCESS_REPOSITORY,
    MEMBERSHIP_ADMINISTRATION_REPOSITORY,
  ],
})
export class OrganizationsModule {}
