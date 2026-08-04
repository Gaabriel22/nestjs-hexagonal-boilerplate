import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'

import type { AccessTokenClaims } from '../../../identity/application/ports/access-token.service'
import { AccessAuthenticationGuard } from '../../../identity/infrastructure/http/access-authentication.guard'
import { CurrentIdentity } from '../../../identity/infrastructure/http/current-identity.decorator'
import { GetCurrentUserProfile } from '../../application/use-cases/get-current-user-profile'
import { UpdateCurrentUserProfile } from '../../application/use-cases/update-current-user-profile'
import { UpdateCurrentUserProfileDto } from './dto/update-current-user-profile.dto'
import { UserProfileResponse } from './dto/user-profile.response'

@Controller({ path: 'users/me', version: '1' })
@UseGuards(AccessAuthenticationGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUserProfile: GetCurrentUserProfile,
    private readonly updateCurrentUserProfile: UpdateCurrentUserProfile,
  ) {}

  @Get()
  async getProfile(@CurrentIdentity() identity: AccessTokenClaims): Promise<UserProfileResponse> {
    return new UserProfileResponse(await this.getCurrentUserProfile.execute(identity.userId))
  }

  @Patch()
  async updateProfile(
    @CurrentIdentity() identity: AccessTokenClaims,
    @Body() input: UpdateCurrentUserProfileDto,
  ): Promise<UserProfileResponse> {
    return new UserProfileResponse(
      await this.updateCurrentUserProfile.execute(identity.userId, input.displayName),
    )
  }
}
