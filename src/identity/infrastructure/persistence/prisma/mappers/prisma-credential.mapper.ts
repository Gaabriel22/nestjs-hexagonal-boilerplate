import type { Credential as PrismaCredential, Prisma } from '../../../../../generated/prisma/client'
import { Credential } from '../../../../domain/entities/credential'

export class PrismaCredentialMapper {
  static toDomain(record: PrismaCredential): Credential {
    return Credential.restore(record)
  }

  static toPersistence(credential: Credential): Prisma.CredentialUncheckedCreateInput {
    return {
      userId: credential.userId,
      passwordHash: credential.passwordHash,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    }
  }
}
