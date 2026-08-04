import { NormalizedEmail } from '../value-objects/normalized-email'

export interface IdentityUserState {
  readonly id: string
  readonly normalizedEmail: string
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class IdentityUser {
  private constructor(private readonly state: IdentityUserState) {}

  static create(input: {
    readonly id: string
    readonly email: string
    readonly currentTime: Date
  }): IdentityUser {
    return new IdentityUser({
      id: input.id,
      normalizedEmail: NormalizedEmail.create(input.email).value,
      isActive: true,
      createdAt: input.currentTime,
      updatedAt: input.currentTime,
    })
  }

  static restore(state: IdentityUserState): IdentityUser {
    return new IdentityUser(state)
  }

  get id(): string {
    return this.state.id
  }

  get normalizedEmail(): string {
    return this.state.normalizedEmail
  }

  get isActive(): boolean {
    return this.state.isActive
  }

  get createdAt(): Date {
    return this.state.createdAt
  }

  get updatedAt(): Date {
    return this.state.updatedAt
  }
}
