import type { ListedSession } from '../../../application/use-cases/list-active-sessions'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SessionResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiPropertyOptional({ nullable: true, example: 'Firefox on Linux' })
  readonly deviceLabel: string | null

  @ApiProperty({ format: 'date-time' })
  readonly lastActivityAt: string

  @ApiProperty({ format: 'date-time' })
  readonly expiresAt: string

  @ApiProperty({ format: 'date-time' })
  readonly createdAt: string

  @ApiProperty({ example: true })
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
  @ApiProperty({ type: () => [SessionResponse] })
  readonly sessions: SessionResponse[]

  constructor(sessions: ListedSession[]) {
    this.sessions = sessions.map((session) => new SessionResponse(session))
  }
}
