import type { AuditAction, AuditTargetType, SafeAuditMetadata } from '../../domain/audit-event'

export const AUDIT_QUERY_PORT = Symbol('AUDIT_QUERY_PORT')

export interface AuditEventView {
  readonly id: string
  readonly actorUserId: string
  readonly organizationId: string
  readonly action: string
  readonly targetType: string
  readonly targetId: string
  readonly requestIdentifier: string | null
  readonly metadata: SafeAuditMetadata
  readonly occurredAt: Date
}

export interface ListOrganizationAuditEventsInput {
  readonly organizationId: string
  readonly cursor?: string
  readonly limit: number
  readonly action?: AuditAction
  readonly actorUserId?: string
  readonly targetType?: AuditTargetType
  readonly targetId?: string
  readonly occurredFrom?: Date
  readonly occurredTo?: Date
}

export interface OrganizationAuditEventPage {
  readonly events: readonly AuditEventView[]
  readonly nextCursor: string | null
}

export interface AuditQueryPort {
  listOrganizationEvents(
    input: ListOrganizationAuditEventsInput,
  ): Promise<OrganizationAuditEventPage>
}
