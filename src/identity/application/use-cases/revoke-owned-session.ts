import type { Clock } from '../../../shared/application/ports/clock'
import type { SessionManagementRepository } from '../ports/session-management.repository'

export class RevokeOwnedSession {
  constructor(
    private readonly repository: SessionManagementRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    await this.repository.revokeOwnedSession(userId, sessionId, this.clock.now())
  }
}
