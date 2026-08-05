import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import type { AccessTokenClaims } from '../../../identity/application/ports/access-token.service'
import { AccessAuthenticationGuard } from '../../../identity/infrastructure/http/access-authentication.guard'
import { CurrentIdentity } from '../../../identity/infrastructure/http/current-identity.decorator'
import { CreateOrganization } from '../../application/use-cases/create-organization'
import { ListOrganizationMemberships } from '../../application/use-cases/list-organization-memberships'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { CreatedOrganizationResponse } from './dto/created-organization.response'
import { MembershipListQuery } from './dto/membership-list.query'
import { MembershipListResponse } from './dto/membership-list.response'
import { OrganizationIdParams } from './dto/organization-id.params'
import { OrganizationPermissionGuard } from './organization-permission.guard'
import { RequireOrganizationPermission } from './require-organization-permission.decorator'

@Controller({ path: 'organizations', version: '1' })
@UseGuards(AccessAuthenticationGuard)
export class OrganizationsController {
  constructor(
    private readonly createOrganization: CreateOrganization,
    private readonly listOrganizationMemberships: ListOrganizationMemberships,
  ) {}

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

  @Get(':organizationId/memberships')
  @UseGuards(OrganizationPermissionGuard)
  @RequireOrganizationPermission('membership:read')
  async listMemberships(
    @Param() params: OrganizationIdParams,
    @Query() query: MembershipListQuery,
  ): Promise<MembershipListResponse> {
    return new MembershipListResponse(
      await this.listOrganizationMemberships.execute({
        organizationId: params.organizationId,
        cursor: query.cursor,
        limit: query.limit,
      }),
    )
  }
}
