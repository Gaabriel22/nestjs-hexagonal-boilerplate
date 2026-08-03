export interface IdentitySessionState {
  readonly id: string
  readonly userId: string
  readonly refreshTokenHash: string
  readonly deviceLabel: string | null
  readonly lastActivityAt: Date
  readonly expiresAt: Date
  readonly revokedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class IdentitySession {
  private constructor(private readonly state: IdentitySessionState) {}

  static restore(state: IdentitySessionState): IdentitySession {
    return new IdentitySession(state)
  }

  get id(): string {
    return this.state.id
  }

  get userId(): string {
    return this.state.userId
  }

  get refreshTokenHash(): string {
    return this.state.refreshTokenHash
  }

  get deviceLabel(): string | null {
    return this.state.deviceLabel
  }

  get lastActivityAt(): Date {
    return this.state.lastActivityAt
  }

  get expiresAt(): Date {
    return this.state.expiresAt
  }

  get revokedAt(): Date | null {
    return this.state.revokedAt
  }

  get createdAt(): Date {
    return this.state.createdAt
  }

  get updatedAt(): Date {
    return this.state.updatedAt
  }
}
