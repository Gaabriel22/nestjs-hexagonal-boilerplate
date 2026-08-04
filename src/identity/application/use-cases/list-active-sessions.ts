import type { Clock } from '../../../shared/application/ports/clock'
import type {
  ActiveSessionView,
  SessionManagementRepository,
} from '../ports/session-management.repository'

export interface ListedSession extends ActiveSessionView {
  readonly isCurrent: boolean
}

export class ListActiveSessions {
  constructor(
    private readonly repository: SessionManagementRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, currentSessionId: string): Promise<ListedSession[]> {
    const sessions = await this.repository.findActiveSessions(userId, this.clock.now())

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }))
  }
}
