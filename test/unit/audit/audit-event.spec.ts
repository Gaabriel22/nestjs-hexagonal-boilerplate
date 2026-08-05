import { AuditEvent } from '../../../src/audit/domain/audit-event'

const EVENT_ID = '00000000-0000-4000-8000-000000001601'
const ACTOR_ID = '00000000-0000-4000-8000-000000001602'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001603'
const TARGET_ID = '00000000-0000-4000-8000-000000001604'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('AuditEvent', () => {
  it('keeps only action-specific safe metadata fields', () => {
    const event = AuditEvent.create({
      id: EVENT_ID,
      actorUserId: ACTOR_ID,
      organizationId: ORGANIZATION_ID,
      action: 'organization.membership_role_changed',
      targetType: 'membership',
      targetId: TARGET_ID,
      metadata: {
        previousRole: 'member',
        role: 'admin',
        password: 'plain-secret',
        credentialHash: 'credential-secret',
        accessToken: 'access-secret',
        refreshToken: 'refresh-secret',
        authorization: 'Bearer secret',
        cookie: 'session=secret',
        body: { unrestricted: true },
      },
      occurredAt: NOW,
    })

    expect(event.toPrimitives().metadata).toEqual({
      previousRole: 'member',
      role: 'admin',
    })
  })

  it('stores no metadata for actions without allowlisted fields', () => {
    const event = AuditEvent.create({
      id: EVENT_ID,
      actorUserId: ACTOR_ID,
      action: 'identity.user_registered',
      targetType: 'user',
      targetId: ACTOR_ID,
      metadata: { email: 'person@example.com', password: 'secret' },
      occurredAt: NOW,
    })

    expect(event.toPrimitives().metadata).toEqual({})
  })
})
