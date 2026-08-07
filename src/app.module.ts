import { Module } from '@nestjs/common'

import { AuditModule } from './audit/audit.module'
import { IdentityModule } from './identity/identity.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { OperationsModule } from './operations/operations.module'
import { ConfigurationModule } from './shared/infrastructure/config/configuration.module'
import { DatabaseModule } from './shared/infrastructure/database/database.module'
import { RequestContextModule } from './shared/infrastructure/observability/request-context.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigurationModule,
    RequestContextModule,
    DatabaseModule,
    AuditModule,
    IdentityModule,
    UsersModule,
    OrganizationsModule,
    OperationsModule,
  ],
})
export class AppModule {}
