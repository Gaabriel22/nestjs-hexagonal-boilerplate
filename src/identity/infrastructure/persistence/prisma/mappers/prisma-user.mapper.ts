import type { Prisma, User } from '../../../../../generated/prisma/client'
import { IdentityUser } from '../../../../domain/entities/identity-user'

export class PrismaUserMapper {
  static toDomain(record: User): IdentityUser {
    return IdentityUser.restore(record)
  }

  static toPersistence(user: IdentityUser): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id,
      normalizedEmail: user.normalizedEmail,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
