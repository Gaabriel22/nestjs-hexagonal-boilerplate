import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import type { AccessTokenClaims } from '../../../identity/application/ports/access-token.service'
import { AccessAuthenticationGuard } from '../../../identity/infrastructure/http/access-authentication.guard'
import { CurrentIdentity } from '../../../identity/infrastructure/http/current-identity.decorator'
import { CreateOrganization } from '../../application/use-cases/create-organization'
import { ChangeOrganizationMembershipRole } from '../../application/use-cases/change-organization-membership-role'
import { ListOrganizationMemberships } from '../../application/use-cases/list-organization-memberships'
import { RemoveOrganizationMembership } from '../../application/use-cases/remove-organization-membership'
import { ChangeMembershipRoleDto } from './dto/change-membership-role.dto'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { CreatedOrganizationResponse } from './dto/created-organization.response'
import { MembershipListQuery } from './dto/membership-list.query'
import {
  MembershipListResponse,
  OrganizationMembershipResponse,
} from './dto/membership-list.response'
import { MembershipIdParams } from './dto/membership-id.params'
import { OrganizationIdParams } from './dto/organization-id.params'
import { OrganizationPermissionGuard } from './organization-permission.guard'
import { RequireOrganizationPermission } from './require-organization-permission.decorator'

@Controller({ path: 'organizations', version: '1' })
@UseGuards(AccessAuthenticationGuard)
export class OrganizationsController {
  constructor(
    private readonly createOrganization: CreateOrganization,
    private readonly listOrganizationMemberships: ListOrganizationMemberships,
    private readonly changeOrganizationMembershipRole: ChangeOrganizationMembershipRole,
    private readonly removeOrganizationMembership: RemoveOrganizationMembership,
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

  @Patch(':organizationId/memberships/:membershipId/role')
  @UseGuards(OrganizationPermissionGuard)
  @RequireOrganizationPermission('membership:manage')
  async changeMembershipRole(
    @CurrentIdentity() identity: AccessTokenClaims,
    @Param() params: MembershipIdParams,
    @Body() input: ChangeMembershipRoleDto,
  ): Promise<OrganizationMembershipResponse> {
    return new OrganizationMembershipResponse(
      await this.changeOrganizationMembershipRole.execute({
        organizationId: params.organizationId,
        actorUserId: identity.userId,
        membershipId: params.membershipId,
        role: input.role,
      }),
    )
  }

  @Delete(':organizationId/memberships/:membershipId')
  @UseGuards(OrganizationPermissionGuard)
  @RequireOrganizationPermission('membership:remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMembership(
    @CurrentIdentity() identity: AccessTokenClaims,
    @Param() params: MembershipIdParams,
  ): Promise<void> {
    await this.removeOrganizationMembership.execute({
      organizationId: params.organizationId,
      actorUserId: identity.userId,
      membershipId: params.membershipId,
    })
  }
}
