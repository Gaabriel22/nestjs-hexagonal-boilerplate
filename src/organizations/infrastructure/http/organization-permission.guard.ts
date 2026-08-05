import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { isUUID } from 'class-validator'

import type { AuthenticatedRequest } from '../../../identity/infrastructure/http/request-identity'
import { createFieldValidationException } from '../../../shared/infrastructure/http/request-validation'
import { OrganizationAccessDeniedError } from '../../application/errors/organization-access-denied.error'
import {
  ORGANIZATION_ACCESS_REPOSITORY,
  type OrganizationAccessRepository,
} from '../../application/ports/organization-access.repository'
import {
  hasOrganizationPermission,
  type OrganizationPermission,
} from '../../application/policies/organization-permission.policy'
import { ORGANIZATION_PERMISSION_METADATA } from './require-organization-permission.decorator'

interface OrganizationRequest extends AuthenticatedRequest {
  readonly params: { readonly organizationId?: unknown }
}

@Injectable()
export class OrganizationPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ORGANIZATION_ACCESS_REPOSITORY)
    private readonly repository: OrganizationAccessRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<OrganizationPermission>(
      ORGANIZATION_PERMISSION_METADATA,
      [context.getHandler(), context.getClass()],
    )

    if (requiredPermission === undefined) {
      return true
    }

    const request = context.switchToHttp().getRequest<OrganizationRequest>()
    const organizationId = request.params.organizationId
    const userId = request.identity?.userId

    if (typeof organizationId !== 'string' || !isUUID(organizationId, '4')) {
      throw createFieldValidationException([
        { field: 'organizationId', messages: ['organizationId must be a UUID'] },
      ])
    }

    if (userId === undefined) {
      throw new OrganizationAccessDeniedError()
    }

    const membership = await this.repository.findMembershipForAuthorization(organizationId, userId)

    if (membership === null || !hasOrganizationPermission(membership, requiredPermission)) {
      throw new OrganizationAccessDeniedError()
    }

    return true
  }
}
