import { Injectable } from '@nestjs/common'

import type {
  RegistrationPersistenceResult,
  RegistrationRepository,
} from '../../../../application/ports/registration.repository'
import type { Credential } from '../../../../domain/entities/credential'
import type { IdentityUser } from '../../../../domain/entities/identity-user'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaCredentialMapper } from '../mappers/prisma-credential.mapper'
import { PrismaUserMapper } from '../mappers/prisma-user.mapper'

interface PrismaErrorLike {
  readonly code?: unknown
}

function isUniqueConstraintError(error: unknown): error is PrismaErrorLike {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

@Injectable()
export class PrismaRegistrationRepository implements RegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUserWithCredential(
    user: IdentityUser,
    credential: Credential,
  ): Promise<RegistrationPersistenceResult> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.user.create({ data: PrismaUserMapper.toPersistence(user) })
        await transaction.credential.create({
          data: PrismaCredentialMapper.toPersistence(credential),
        })
      })
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        const existingUser = await this.prisma.user.findUnique({
          where: { normalizedEmail: user.normalizedEmail },
          select: { id: true },
        })

        if (existingUser !== null) {
          return 'email_conflict'
        }
      }

      throw error
    }

    return 'created'
  }
}
