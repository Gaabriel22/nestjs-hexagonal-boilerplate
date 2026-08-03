import { Module } from '@nestjs/common'

import { CREDENTIAL_REPOSITORY } from './domain/repositories/credential.repository'
import { SESSION_REPOSITORY } from './domain/repositories/session.repository'
import { USER_REPOSITORY } from './domain/repositories/user.repository'
import { PrismaCredentialRepository } from './infrastructure/persistence/prisma/repositories/prisma-credential.repository'
import { PrismaSessionRepository } from './infrastructure/persistence/prisma/repositories/prisma-session.repository'
import { PrismaUserRepository } from './infrastructure/persistence/prisma/repositories/prisma-user.repository'

@Module({
  providers: [
    PrismaUserRepository,
    PrismaCredentialRepository,
    PrismaSessionRepository,
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
  ],
  exports: [USER_REPOSITORY, CREDENTIAL_REPOSITORY, SESSION_REPOSITORY],
})
export class IdentityModule {}
