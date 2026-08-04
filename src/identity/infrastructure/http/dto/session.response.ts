import type { ListedSession } from '../../../application/use-cases/list-active-sessions'

export class SessionResponse {
  readonly id: string
  readonly deviceLabel: string | null
  readonly lastActivityAt: string
  readonly expiresAt: string
  readonly createdAt: string
  readonly isCurrent: boolean

  constructor(session: ListedSession) {
    this.id = session.id
    this.deviceLabel = session.deviceLabel
    this.lastActivityAt = session.lastActivityAt.toISOString()
    this.expiresAt = session.expiresAt.toISOString()
    this.createdAt = session.createdAt.toISOString()
    this.isCurrent = session.isCurrent
  }
}

export class SessionListResponse {
  readonly sessions: SessionResponse[]

  constructor(sessions: ListedSession[]) {
    this.sessions = sessions.map((session) => new SessionResponse(session))
  }
}
