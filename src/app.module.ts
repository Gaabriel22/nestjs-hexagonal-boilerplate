import { Module } from '@nestjs/common'

import { AuditModule } from './audit/audit.module'
import { IdentityModule } from './identity/identity.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { ConfigurationModule } from './shared/infrastructure/config/configuration.module'
import { DatabaseModule } from './shared/infrastructure/database/database.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    AuditModule,
    IdentityModule,
    UsersModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
