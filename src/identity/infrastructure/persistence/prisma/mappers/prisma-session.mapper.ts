import type { Prisma, Session } from '../../../../../generated/prisma/client'
import { IdentitySession } from '../../../../domain/entities/identity-session'

export class PrismaSessionMapper {
  static toDomain(record: Session): IdentitySession {
    return IdentitySession.restore(record)
  }

  static toPersistence(session: IdentitySession): Prisma.SessionUncheckedCreateInput {
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      deviceLabel: session.deviceLabel,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }
  }
}
