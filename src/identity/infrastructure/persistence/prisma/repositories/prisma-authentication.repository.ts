import { Injectable } from '@nestjs/common'

import type {
  ActiveIdentity,
  AuthenticationRepository,
  CredentialIdentity,
} from '../../../../application/ports/authentication.repository'
import type { IdentitySession } from '../../../../domain/entities/identity-session'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaSessionMapper } from '../mappers/prisma-session.mapper'

@Injectable()
export class PrismaAuthenticationRepository implements AuthenticationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCredentialIdentity(normalizedEmail: string): Promise<CredentialIdentity | null> {
    const user = await this.prisma.user.findUnique({
      where: { normalizedEmail },
      include: { credential: true },
    })

    if (user === null || user.credential === null) {
      return null
    }

    return {
      userId: user.id,
      normalizedEmail: user.normalizedEmail,
      isActive: user.isActive,
      passwordHash: user.credential.passwordHash,
    }
  }

  async createSession(session: IdentitySession): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.session.create({ data: PrismaSessionMapper.toPersistence(session) })
      await transaction.sessionRefreshToken.create({
        data: {
          tokenHash: session.refreshTokenHash,
          sessionId: session.id,
          issuedAt: session.createdAt,
        },
      })
    })
  }

  async findActiveIdentity(
    userId: string,
    sessionId: string,
    currentTime: Date,
  ): Promise<ActiveIdentity | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: currentTime },
        user: { isActive: true },
      },
      select: { id: true, userId: true },
    })

    return session === null ? null : { userId: session.userId, sessionId: session.id }
  }
}
