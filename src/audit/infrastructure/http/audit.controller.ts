import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'

import { AccessAuthenticationGuard } from '../../../identity/infrastructure/http/access-authentication.guard'
import { OrganizationIdParams } from '../../../organizations/infrastructure/http/dto/organization-id.params'
import { OrganizationPermissionGuard } from '../../../organizations/infrastructure/http/organization-permission.guard'
import { RequireOrganizationPermission } from '../../../organizations/infrastructure/http/require-organization-permission.decorator'
import { ListOrganizationAuditEvents } from '../../application/use-cases/list-organization-audit-events'
import { AuditEventListQuery } from './dto/audit-event-list.query'
import { AuditEventListResponse } from './dto/audit-event-list.response'

@Controller({ path: 'organizations', version: '1' })
@UseGuards(AccessAuthenticationGuard)
export class AuditController {
  constructor(private readonly listOrganizationAuditEvents: ListOrganizationAuditEvents) {}

  @Get(':organizationId/audit-events')
  @UseGuards(OrganizationPermissionGuard)
  @RequireOrganizationPermission('audit:read')
  async list(
    @Param() params: OrganizationIdParams,
    @Query() query: AuditEventListQuery,
  ): Promise<AuditEventListResponse> {
    return new AuditEventListResponse(
      await this.listOrganizationAuditEvents.execute({
        organizationId: params.organizationId,
        cursor: query.cursor,
        limit: query.limit,
        action: query.action,
        actorUserId: query.actorUserId,
        targetType: query.targetType,
        targetId: query.targetId,
        occurredFrom: query.occurredFrom === undefined ? undefined : new Date(query.occurredFrom),
        occurredTo: query.occurredTo === undefined ? undefined : new Date(query.occurredTo),
      }),
    )
  }
}
