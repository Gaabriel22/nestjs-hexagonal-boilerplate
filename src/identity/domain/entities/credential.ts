export interface CredentialState {
  readonly userId: string
  readonly passwordHash: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class Credential {
  private constructor(private readonly state: CredentialState) {}

  static restore(state: CredentialState): Credential {
    return new Credential(state)
  }

  get userId(): string {
    return this.state.userId
  }

  get passwordHash(): string {
    return this.state.passwordHash
  }

  get createdAt(): Date {
    return this.state.createdAt
  }

  get updatedAt(): Date {
    return this.state.updatedAt
  }
}
