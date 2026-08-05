import type { Clock } from '../../../shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../shared/application/ports/identifier-generator'
import type { SessionManagementRepository } from '../ports/session-management.repository'

export class LogoutCurrentSession {
  constructor(
    private readonly repository: SessionManagementRepository,
    private readonly clock: Clock,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    await this.repository.revokeOwnedSession({
      userId,
      sessionId,
      currentTime: this.clock.now(),
      reason: 'logout',
      audit: { eventId: this.identifiers.generate() },
    })
  }
}
