import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { AccessTokenClaims } from '../../../identity/application/ports/access-token.service'
import { AccessAuthenticationGuard } from '../../../identity/infrastructure/http/access-authentication.guard'
import { CurrentIdentity } from '../../../identity/infrastructure/http/current-identity.decorator'
import { OPENAPI_BEARER_SCHEME } from '../../../shared/infrastructure/http/configure-api-documentation'
import { ApiStandardProblemResponses } from '../../../shared/infrastructure/http/openapi-problem-responses'
import { GetCurrentUserProfile } from '../../application/use-cases/get-current-user-profile'
import { UpdateCurrentUserProfile } from '../../application/use-cases/update-current-user-profile'
import { UpdateCurrentUserProfileDto } from './dto/update-current-user-profile.dto'
import { UserProfileResponse } from './dto/user-profile.response'

@Controller({ path: 'users/me', version: '1' })
@UseGuards(AccessAuthenticationGuard)
@ApiTags('Users')
@ApiBearerAuth(OPENAPI_BEARER_SCHEME)
export class UsersController {
  constructor(
    private readonly getCurrentUserProfile: GetCurrentUserProfile,
    private readonly updateCurrentUserProfile: UpdateCurrentUserProfile,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ description: 'Current user profile', type: UserProfileResponse })
  @ApiStandardProblemResponses({ unauthorized: true, notFound: true })
  async getProfile(@CurrentIdentity() identity: AccessTokenClaims): Promise<UserProfileResponse> {
    return new UserProfileResponse(await this.getCurrentUserProfile.execute(identity.userId))
  }

  @Patch()
  @ApiOperation({ summary: 'Update supported current user profile fields' })
  @ApiOkResponse({ description: 'Updated current user profile', type: UserProfileResponse })
  @ApiStandardProblemResponses({ unauthorized: true, notFound: true })
  async updateProfile(
    @CurrentIdentity() identity: AccessTokenClaims,
    @Body() input: UpdateCurrentUserProfileDto,
  ): Promise<UserProfileResponse> {
    return new UserProfileResponse(
      await this.updateCurrentUserProfile.execute(identity.userId, input.displayName),
    )
  }
}
