import { Injectable } from '@nestjs/common'

import type {
  AuditEventView,
  AuditQueryPort,
  ListOrganizationAuditEventsInput,
  OrganizationAuditEventPage,
} from '../../application/ports/audit-query.port'
import { AUDIT_ACTIONS, allowSafeAuditMetadata, type AuditAction } from '../../domain/audit-event'
import type { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'

const auditActions = new Set<string>(AUDIT_ACTIONS)

function isAuditAction(value: string): value is AuditAction {
  return auditActions.has(value)
}

function toMetadataRecord(value: Prisma.JsonValue): Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
}

@Injectable()
export class PrismaAuditQueryAdapter implements AuditQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listOrganizationEvents(
    input: ListOrganizationAuditEventsInput,
  ): Promise<OrganizationAuditEventPage> {
    const cursor = await this.resolveCursor(input.organizationId, input.cursor)

    if (input.cursor !== undefined && cursor === null) {
      return { events: [], nextCursor: null }
    }

    const records = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: input.action,
        actorUserId: input.actorUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        occurredAt: {
          gte: input.occurredFrom,
          lte: input.occurredTo,
        },
        OR:
          cursor === null
            ? undefined
            : [
                { occurredAt: { lt: cursor.occurredAt } },
                { occurredAt: cursor.occurredAt, id: { lt: cursor.id } },
              ],
      },
      select: {
        id: true,
        actorUserId: true,
        organizationId: true,
        action: true,
        targetType: true,
        targetId: true,
        requestIdentifier: true,
        metadata: true,
        occurredAt: true,
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    })
    const mapped = records.map((record): AuditEventView => ({
      ...record,
      organizationId: input.organizationId,
      metadata: isAuditAction(record.action)
        ? allowSafeAuditMetadata(record.action, toMetadataRecord(record.metadata))
        : {},
    }))
    const hasNextPage = mapped.length > input.limit
    const events = hasNextPage ? mapped.slice(0, input.limit) : mapped

    return {
      events,
      nextCursor: hasNextPage ? (events.at(-1)?.id ?? null) : null,
    }
  }

  private resolveCursor(
    organizationId: string,
    cursor: string | undefined,
  ): Promise<{ readonly id: string; readonly occurredAt: Date } | null> {
    if (cursor === undefined) {
      return Promise.resolve(null)
    }

    return this.prisma.auditEvent.findFirst({
      where: { id: cursor, organizationId },
      select: { id: true, occurredAt: true },
    })
  }
}
