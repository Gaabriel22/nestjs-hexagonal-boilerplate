import { Module } from '@nestjs/common'

import { IdentityModule } from './identity/identity.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { ConfigurationModule } from './shared/infrastructure/config/configuration.module'
import { DatabaseModule } from './shared/infrastructure/database/database.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [ConfigurationModule, DatabaseModule, IdentityModule, UsersModule, OrganizationsModule],
})
export class AppModule {}
