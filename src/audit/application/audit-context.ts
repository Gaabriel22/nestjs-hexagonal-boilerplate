export interface AuditContext {
  readonly eventId: string
  readonly requestIdentifier?: string | null
}
