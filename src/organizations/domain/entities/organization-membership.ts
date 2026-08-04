export const MEMBERSHIP_ROLES = ['owner', 'admin', 'member'] as const
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export interface OrganizationMembershipState {
  readonly id: string
  readonly organizationId: string
  readonly userId: string
  readonly role: MembershipRole
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class OrganizationMembership {
  private constructor(private readonly state: OrganizationMembershipState) {}

  static createOwner(input: {
    readonly id: string
    readonly organizationId: string
    readonly userId: string
    readonly currentTime: Date
  }): OrganizationMembership {
    return new OrganizationMembership({
      id: input.id,
      organizationId: input.organizationId,
      userId: input.userId,
      role: 'owner',
      isActive: true,
      createdAt: input.currentTime,
      updatedAt: input.currentTime,
    })
  }

  static restore(state: OrganizationMembershipState): OrganizationMembership {
    return new OrganizationMembership(state)
  }

  get id(): string {
    return this.state.id
  }

  get organizationId(): string {
    return this.state.organizationId
  }

  get userId(): string {
    return this.state.userId
  }

  get role(): MembershipRole {
    return this.state.role
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
