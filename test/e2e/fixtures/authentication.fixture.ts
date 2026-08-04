import { Controller, Get, Module, UseGuards } from '@nestjs/common'

import type { AccessTokenClaims } from '../../../src/identity/application/ports/access-token.service'
import { AccessAuthenticationGuard } from '../../../src/identity/infrastructure/http/access-authentication.guard'
import { CurrentIdentity } from '../../../src/identity/infrastructure/http/current-identity.decorator'
import { IdentityModule } from '../../../src/identity/identity.module'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'

@Controller({ path: 'authentication-probe', version: '1' })
class AuthenticationProbeController {
  @Get()
  @UseGuards(AccessAuthenticationGuard)
  probe(@CurrentIdentity() identity: AccessTokenClaims): AccessTokenClaims {
    return identity
  }
}

@Module({
  imports: [ConfigurationModule, DatabaseModule, IdentityModule],
  controllers: [AuthenticationProbeController],
})
export class AuthenticationFixtureModule {}
