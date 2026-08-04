import { Module } from '@nestjs/common'

import { CLOCK, type Clock } from '../shared/application/ports/clock'
import {
  IDENTIFIER_GENERATOR,
  type IdentifierGenerator,
} from '../shared/application/ports/identifier-generator'
import { CryptoIdentifierGenerator } from '../shared/infrastructure/system/crypto-identifier-generator'
import { SystemClock } from '../shared/infrastructure/system/system-clock'
import { PASSWORD_HASHER, type PasswordHasher } from './application/ports/password-hasher'
import {
  REGISTRATION_REPOSITORY,
  type RegistrationRepository,
} from './application/ports/registration.repository'
import { RegisterUser } from './application/use-cases/register-user'
import { CREDENTIAL_REPOSITORY } from './domain/repositories/credential.repository'
import { SESSION_REPOSITORY } from './domain/repositories/session.repository'
import { USER_REPOSITORY } from './domain/repositories/user.repository'
import { IdentityController } from './infrastructure/http/identity.controller'
import { PrismaCredentialRepository } from './infrastructure/persistence/prisma/repositories/prisma-credential.repository'
import { PrismaRegistrationRepository } from './infrastructure/persistence/prisma/repositories/prisma-registration.repository'
import { PrismaSessionRepository } from './infrastructure/persistence/prisma/repositories/prisma-session.repository'
import { PrismaUserRepository } from './infrastructure/persistence/prisma/repositories/prisma-user.repository'
import { Argon2idPasswordHasher } from './infrastructure/security/argon2id-password-hasher'

@Module({
  controllers: [IdentityController],
  providers: [
    PrismaUserRepository,
    PrismaCredentialRepository,
    PrismaSessionRepository,
    PrismaRegistrationRepository,
    Argon2idPasswordHasher,
    CryptoIdentifierGenerator,
    SystemClock,
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    {
      provide: CREDENTIAL_REPOSITORY,
      useExisting: PrismaCredentialRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useExisting: PrismaSessionRepository,
    },
    {
      provide: REGISTRATION_REPOSITORY,
      useExisting: PrismaRegistrationRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: Argon2idPasswordHasher,
    },
    {
      provide: IDENTIFIER_GENERATOR,
      useExisting: CryptoIdentifierGenerator,
    },
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    {
      provide: RegisterUser,
      inject: [PASSWORD_HASHER, REGISTRATION_REPOSITORY, IDENTIFIER_GENERATOR, CLOCK],
      useFactory: (
        passwordHasher: PasswordHasher,
        registrationRepository: RegistrationRepository,
        identifierGenerator: IdentifierGenerator,
        clock: Clock,
      ): RegisterUser =>
        new RegisterUser(passwordHasher, registrationRepository, identifierGenerator, clock),
    },
  ],
  exports: [USER_REPOSITORY, CREDENTIAL_REPOSITORY, SESSION_REPOSITORY],
})
export class IdentityModule {}
