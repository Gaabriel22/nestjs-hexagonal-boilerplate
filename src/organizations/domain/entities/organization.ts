import { OrganizationName } from '../value-objects/organization-name'

export interface OrganizationState {
  readonly id: string
  readonly name: string
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class Organization {
  private constructor(private readonly state: OrganizationState) {}

  static create(input: {
    readonly id: string
    readonly name: string
    readonly currentTime: Date
  }): Organization {
    return new Organization({
      id: input.id,
      name: OrganizationName.create(input.name).value,
      isActive: true,
      createdAt: input.currentTime,
      updatedAt: input.currentTime,
    })
  }

  static restore(state: OrganizationState): Organization {
    return new Organization(state)
  }

  get id(): string {
    return this.state.id
  }

  get name(): string {
    return this.state.name
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
