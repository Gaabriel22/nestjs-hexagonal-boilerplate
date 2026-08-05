import type { AuditEvent } from '../../domain/audit-event'

export const AUDIT_APPEND_PORT = Symbol('AUDIT_APPEND_PORT')

export interface AuditAppendPort {
  append(event: AuditEvent): Promise<void>
}
