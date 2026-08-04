import { InvalidCredentialError } from '../errors/invalid-credential.error'

export interface CredentialState {
  readonly userId: string
  readonly passwordHash: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class Credential {
  private constructor(private readonly state: CredentialState) {}

  static create(input: {
    readonly userId: string
    readonly passwordHash: string
    readonly currentTime: Date
  }): Credential {
    if (input.passwordHash.trim().length === 0) {
      throw new InvalidCredentialError()
    }

    return new Credential({
      userId: input.userId,
      passwordHash: input.passwordHash,
      createdAt: input.currentTime,
      updatedAt: input.currentTime,
    })
  }

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
