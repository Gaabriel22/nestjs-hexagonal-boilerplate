import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'

import type { AccessTokenClaims } from '../../../identity/application/ports/access-token.service'
import { AccessAuthenticationGuard } from '../../../identity/infrastructure/http/access-authentication.guard'
import { CurrentIdentity } from '../../../identity/infrastructure/http/current-identity.decorator'
import { CreateOrganization } from '../../application/use-cases/create-organization'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { CreatedOrganizationResponse } from './dto/created-organization.response'

@Controller({ path: 'organizations', version: '1' })
@UseGuards(AccessAuthenticationGuard)
export class OrganizationsController {
  constructor(private readonly createOrganization: CreateOrganization) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentIdentity() identity: AccessTokenClaims,
    @Body() input: CreateOrganizationDto,
  ): Promise<CreatedOrganizationResponse> {
    return new CreatedOrganizationResponse(
      await this.createOrganization.execute({
        actorUserId: identity.userId,
        name: input.name,
      }),
    )
  }
}
