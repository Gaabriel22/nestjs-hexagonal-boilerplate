import type { Clock } from '../../../shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../shared/application/ports/identifier-generator'
import { Credential } from '../../domain/entities/credential'
import { IdentityUser } from '../../domain/entities/identity-user'
import { PasswordPolicy } from '../../domain/services/password-policy'
import { EmailAlreadyRegisteredError } from '../errors/email-already-registered.error'
import type { PasswordHasher } from '../ports/password-hasher'
import type { RegistrationRepository } from '../ports/registration.repository'

export interface RegisterUserCommand {
  readonly email: string
  readonly password: string
}

export interface RegisteredUserResult {
  readonly id: string
  readonly email: string
  readonly isActive: boolean
  readonly createdAt: Date
}

export class RegisterUser {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    private readonly registrationRepository: RegistrationRepository,
    private readonly identifierGenerator: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisteredUserResult> {
    PasswordPolicy.assertValid(command.password)

    const currentTime = this.clock.now()
    const user = IdentityUser.create({
      id: this.identifierGenerator.generate(),
      email: command.email,
      currentTime,
    })
    const passwordHash = await this.passwordHasher.hash(command.password)
    const credential = Credential.create({
      userId: user.id,
      passwordHash,
      currentTime,
    })
    const persistenceResult = await this.registrationRepository.createUserWithCredential(
      user,
      credential,
    )

    if (persistenceResult === 'email_conflict') {
      throw new EmailAlreadyRegisteredError()
    }

    return {
      id: user.id,
      email: user.normalizedEmail,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }
  }
}
