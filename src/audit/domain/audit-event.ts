export const AUDIT_ACTIONS = [
  'identity.user_registered',
  'identity.session_created',
  'identity.refresh_rotated',
  'identity.refresh_reuse_detected',
  'identity.session_revoked',
  'organization.created',
  'organization.membership_role_changed',
  'organization.membership_removed',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const AUDIT_TARGET_TYPES = ['user', 'session', 'organization', 'membership'] as const

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number]

type SafeAuditMetadataValue = string | number | boolean | null

export type SafeAuditMetadata = Readonly<Record<string, SafeAuditMetadataValue>>

const METADATA_ALLOWLIST: Readonly<Record<AuditAction, readonly string[]>> = {
  'identity.user_registered': [],
  'identity.session_created': [],
  'identity.refresh_rotated': [],
  'identity.refresh_reuse_detected': [],
  'identity.session_revoked': ['reason'],
  'organization.created': [],
  'organization.membership_role_changed': ['previousRole', 'role'],
  'organization.membership_removed': ['role'],
}

export interface CreateAuditEventInput {
  readonly id: string
  readonly actorUserId: string
  readonly organizationId?: string | null
  readonly action: AuditAction
  readonly targetType: AuditTargetType
  readonly targetId: string
  readonly requestIdentifier?: string | null
  readonly metadata?: Readonly<Record<string, unknown>>
  readonly occurredAt: Date
}

export interface AuditEventPrimitives {
  readonly id: string
  readonly actorUserId: string
  readonly organizationId: string | null
  readonly action: AuditAction
  readonly targetType: AuditTargetType
  readonly targetId: string
  readonly requestIdentifier: string | null
  readonly metadata: SafeAuditMetadata
  readonly occurredAt: Date
}

function allowSafeMetadata(
  action: AuditAction,
  metadata: Readonly<Record<string, unknown>>,
): SafeAuditMetadata {
  const allowedKeys = new Set(METADATA_ALLOWLIST[action])
  const safeEntries = Object.entries(metadata).filter(
    (entry): entry is [string, SafeAuditMetadataValue] =>
      allowedKeys.has(entry[0]) &&
      (entry[1] === null ||
        typeof entry[1] === 'string' ||
        typeof entry[1] === 'number' ||
        typeof entry[1] === 'boolean'),
  )

  return Object.freeze(Object.fromEntries(safeEntries))
}

export class AuditEvent {
  private constructor(private readonly values: AuditEventPrimitives) {}

  static create(input: CreateAuditEventInput): AuditEvent {
    return new AuditEvent({
      id: input.id,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      requestIdentifier: input.requestIdentifier ?? null,
      metadata: allowSafeMetadata(input.action, input.metadata ?? {}),
      occurredAt: new Date(input.occurredAt),
    })
  }

  toPrimitives(): AuditEventPrimitives {
    return {
      ...this.values,
      metadata: { ...this.values.metadata },
      occurredAt: new Date(this.values.occurredAt),
    }
  }
}
