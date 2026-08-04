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
  ORGANIZATION_CREATION_REPOSITORY,
  type OrganizationCreationRepository,
} from './application/ports/organization-creation.repository'
import { CreateOrganization } from './application/use-cases/create-organization'
import { MEMBERSHIP_REPOSITORY } from './domain/repositories/membership.repository'
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository'
import { OrganizationsController } from './infrastructure/http/organizations.controller'
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
    CryptoIdentifierGenerator,
    SystemClock,
    { provide: ORGANIZATION_REPOSITORY, useExisting: PrismaOrganizationRepository },
    { provide: MEMBERSHIP_REPOSITORY, useExisting: PrismaMembershipRepository },
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
  ],
  exports: [ORGANIZATION_REPOSITORY, MEMBERSHIP_REPOSITORY],
})
export class OrganizationsModule {}
