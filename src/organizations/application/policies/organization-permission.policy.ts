import type { MembershipRole } from '../../domain/entities/organization-membership'

export const ORGANIZATION_PERMISSIONS = [
  'organization:read',
  'organization:update',
  'organization:delete',
  'membership:read',
  'membership:manage',
  'membership:remove',
  'audit:read',
] as const

export type OrganizationPermission = (typeof ORGANIZATION_PERMISSIONS)[number]

const ROLE_PERMISSIONS: Readonly<Record<MembershipRole, ReadonlySet<OrganizationPermission>>> = {
  owner: new Set(ORGANIZATION_PERMISSIONS),
  admin: new Set([
    'organization:read',
    'organization:update',
    'membership:read',
    'membership:manage',
    'membership:remove',
    'audit:read',
  ]),
  member: new Set(['organization:read', 'membership:read']),
}

export interface OrganizationPermissionSubject {
  readonly role: MembershipRole
  readonly isActive: boolean
}

export function permissionsForRole(role: MembershipRole): readonly OrganizationPermission[] {
  return ORGANIZATION_PERMISSIONS.filter((permission) => ROLE_PERMISSIONS[role].has(permission))
}

export function hasOrganizationPermission(
  membership: OrganizationPermissionSubject,
  permission: OrganizationPermission,
): boolean {
  return membership.isActive && ROLE_PERMISSIONS[membership.role].has(permission)
}
