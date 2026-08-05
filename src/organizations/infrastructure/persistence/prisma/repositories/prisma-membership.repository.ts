import { Injectable } from '@nestjs/common'

import { AuditEvent } from '../../../../../audit/domain/audit-event'
import type {
  ChangeMembershipRoleInput,
  ChangeMembershipRoleResult,
  MembershipAdministrationRepository,
  RemoveMembershipInput,
  RemoveMembershipResult,
} from '../../../../application/ports/membership-administration.repository'
import type {
  ActiveOrganizationMembershipPage,
  ListActiveOrganizationMembershipsInput,
  OrganizationAccessRepository,
  OrganizationMembershipAuthorizationView,
} from '../../../../application/ports/organization-access.repository'
import { hasOrganizationPermission } from '../../../../application/policies/organization-permission.policy'
import type { OrganizationMembership } from '../../../../domain/entities/organization-membership'
import type { MembershipRepository } from '../../../../domain/repositories/membership.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaMembershipMapper } from '../mappers/prisma-membership.mapper'

function isRetryableTransactionConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: unknown }).code === 'P2034'
  )
}

@Injectable()
export class PrismaMembershipRepository
  implements MembershipRepository, OrganizationAccessRepository, MembershipAdministrationRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async save(membership: OrganizationMembership): Promise<void> {
    const data = PrismaMembershipMapper.toPersistence(membership)

    await this.prisma.membership.upsert({
      where: { id: membership.id },
      create: data,
      update: {
        role: data.role,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findByIdForOrganization(
    id: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    const record = await this.prisma.membership.findFirst({ where: { id, organizationId } })

    return record === null ? null : PrismaMembershipMapper.toDomain(record)
  }

  findMembershipForAuthorization(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembershipAuthorizationView | null> {
    return this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true, isActive: true },
    })
  }

  async listActiveMemberships(
    input: ListActiveOrganizationMembershipsInput,
  ): Promise<ActiveOrganizationMembershipPage> {
    const records = await this.prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        isActive: true,
        id: input.cursor === undefined ? undefined : { gt: input.cursor },
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
      take: input.limit + 1,
    })
    const hasNextPage = records.length > input.limit
    const memberships = hasNextPage ? records.slice(0, input.limit) : records

    return {
      memberships,
      nextCursor: hasNextPage ? (memberships.at(-1)?.id ?? null) : null,
    }
  }

  changeRole(input: ChangeMembershipRoleInput): Promise<ChangeMembershipRoleResult> {
    return this.prisma.$transaction(
      async (transaction) => {
        const actor = await transaction.membership.findUnique({
          where: {
            organizationId_userId: {
              organizationId: input.organizationId,
              userId: input.actorUserId,
            },
          },
          select: { role: true, isActive: true },
        })

        if (actor === null || !hasOrganizationPermission(actor, 'membership:manage')) {
          return { outcome: 'forbidden' }
        }

        const target = await transaction.membership.findFirst({
          where: { id: input.membershipId, organizationId: input.organizationId, isActive: true },
        })

        if (target === null) {
          return { outcome: 'not_found' }
        }

        if (target.role === 'owner') {
          return { outcome: 'owner_protected' }
        }

        if (target.role === input.role) {
          await transaction.auditEvent.create({
            data: AuditEvent.create({
              id: input.audit.eventId,
              actorUserId: input.actorUserId,
              organizationId: input.organizationId,
              action: 'organization.membership_role_changed',
              targetType: 'membership',
              targetId: target.id,
              requestIdentifier: input.audit.requestIdentifier,
              metadata: { previousRole: target.role, role: input.role },
              occurredAt: input.currentTime,
            }).toPrimitives(),
          })

          return { outcome: 'changed', membership: target }
        }

        const changed = await transaction.membership.updateMany({
          where: {
            id: target.id,
            organizationId: input.organizationId,
            isActive: true,
            role: target.role,
          },
          data: { role: input.role, updatedAt: input.currentTime },
        })

        if (changed.count !== 1) {
          return { outcome: 'not_found' }
        }

        await transaction.auditEvent.create({
          data: AuditEvent.create({
            id: input.audit.eventId,
            actorUserId: input.actorUserId,
            organizationId: input.organizationId,
            action: 'organization.membership_role_changed',
            targetType: 'membership',
            targetId: target.id,
            requestIdentifier: input.audit.requestIdentifier,
            metadata: { previousRole: target.role, role: input.role },
            occurredAt: input.currentTime,
          }).toPrimitives(),
        })

        return {
          outcome: 'changed',
          membership: { ...target, role: input.role, updatedAt: input.currentTime },
        }
      },
      { isolationLevel: 'Serializable' },
    )
  }

  async remove(input: RemoveMembershipInput): Promise<RemoveMembershipResult> {
    const maximumAttempts = 3

    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const actor = await transaction.membership.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: input.organizationId,
                  userId: input.actorUserId,
                },
              },
              select: { role: true, isActive: true },
            })

            if (actor === null || !hasOrganizationPermission(actor, 'membership:remove')) {
              return { outcome: 'forbidden' }
            }

            const target = await transaction.membership.findFirst({
              where: {
                id: input.membershipId,
                organizationId: input.organizationId,
                isActive: true,
              },
              select: { id: true, role: true },
            })

            if (target === null) {
              return { outcome: 'not_found' }
            }

            if (target.role === 'owner') {
              if (actor.role !== 'owner') {
                return { outcome: 'forbidden' }
              }

              const activeOwnerCount = await transaction.membership.count({
                where: { organizationId: input.organizationId, role: 'owner', isActive: true },
              })

              if (activeOwnerCount <= 1) {
                return { outcome: 'last_owner' }
              }
            }

            const removed = await transaction.membership.updateMany({
              where: { id: target.id, organizationId: input.organizationId, isActive: true },
              data: { isActive: false, updatedAt: input.currentTime },
            })

            if (removed.count === 1) {
              await transaction.auditEvent.create({
                data: AuditEvent.create({
                  id: input.audit.eventId,
                  actorUserId: input.actorUserId,
                  organizationId: input.organizationId,
                  action: 'organization.membership_removed',
                  targetType: 'membership',
                  targetId: target.id,
                  requestIdentifier: input.audit.requestIdentifier,
                  metadata: { role: target.role },
                  occurredAt: input.currentTime,
                }).toPrimitives(),
              })
            }

            return removed.count === 1 ? { outcome: 'removed' } : { outcome: 'not_found' }
          },
          { isolationLevel: 'Serializable' },
        )
      } catch (error) {
        if (!isRetryableTransactionConflict(error) || attempt === maximumAttempts) {
          throw error
        }
      }
    }

    throw new Error('Membership removal transaction exhausted retry attempts')
  }
}
