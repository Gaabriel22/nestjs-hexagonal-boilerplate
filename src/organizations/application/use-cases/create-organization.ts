import { AuditEvent } from '../../../audit/domain/audit-event'
import type { Clock } from '../../../shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../shared/application/ports/identifier-generator'
import { Organization } from '../../domain/entities/organization'
import { OrganizationMembership } from '../../domain/entities/organization-membership'
import type { OrganizationCreationRepository } from '../ports/organization-creation.repository'

export interface CreateOrganizationCommand {
  readonly actorUserId: string
  readonly name: string
}

export interface CreateOrganizationResult {
  readonly id: string
  readonly name: string
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly ownerMembership: {
    readonly id: string
    readonly organizationId: string
    readonly userId: string
    readonly role: 'owner'
    readonly isActive: boolean
    readonly createdAt: Date
    readonly updatedAt: Date
  }
}

export class CreateOrganization {
  constructor(
    private readonly repository: OrganizationCreationRepository,
    private readonly identifiers: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<CreateOrganizationResult> {
    const currentTime = this.clock.now()
    const organization = Organization.create({
      id: this.identifiers.generate(),
      name: command.name,
      currentTime,
    })
    const ownerMembership = OrganizationMembership.createOwner({
      id: this.identifiers.generate(),
      organizationId: organization.id,
      userId: command.actorUserId,
      currentTime,
    })

    await this.repository.createWithOwner(
      organization,
      ownerMembership,
      AuditEvent.create({
        id: this.identifiers.generate(),
        actorUserId: command.actorUserId,
        organizationId: organization.id,
        action: 'organization.created',
        targetType: 'organization',
        targetId: organization.id,
        occurredAt: currentTime,
      }),
    )

    return {
      id: organization.id,
      name: organization.name,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      ownerMembership: {
        id: ownerMembership.id,
        organizationId: ownerMembership.organizationId,
        userId: ownerMembership.userId,
        role: 'owner',
        isActive: ownerMembership.isActive,
        createdAt: ownerMembership.createdAt,
        updatedAt: ownerMembership.updatedAt,
      },
    }
  }
}
