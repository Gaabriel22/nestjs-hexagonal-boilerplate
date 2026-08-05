import { SetMetadata } from '@nestjs/common'

import type { OrganizationPermission } from '../../application/policies/organization-permission.policy'

export const ORGANIZATION_PERMISSION_METADATA = Symbol('ORGANIZATION_PERMISSION_METADATA')

export const RequireOrganizationPermission = (
  permission: OrganizationPermission,
): MethodDecorator & ClassDecorator => SetMetadata(ORGANIZATION_PERMISSION_METADATA, permission)
