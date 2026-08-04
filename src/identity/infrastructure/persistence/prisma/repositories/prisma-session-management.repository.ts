import { Injectable } from '@nestjs/common'

import type {
  ActiveSessionView,
  RotateRefreshTokenInput,
  RotateRefreshTokenResult,
  SessionManagementRepository,
} from '../../../../application/ports/session-management.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'

@Injectable()
export class PrismaSessionManagementRepository implements SessionManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async rotateRefreshToken(input: RotateRefreshTokenInput): Promise<RotateRefreshTokenResult> {
    return this.prisma.$transaction(async (transaction) => {
      const token = await transaction.sessionRefreshToken.findUnique({
        where: { tokenHash: input.presentedTokenHash },
        include: { session: { include: { user: true } } },
      })

      if (token === null) {
        return { outcome: 'invalid' }
      }

      if (token.usedAt !== null) {
        await transaction.session.updateMany({
          where: { id: token.sessionId, revokedAt: null },
          data: { revokedAt: input.currentTime },
        })

        return { outcome: 'reused' }
      }

      if (
        token.session.revokedAt !== null ||
        token.session.expiresAt <= input.currentTime ||
        !token.session.user.isActive
      ) {
        return { outcome: 'invalid' }
      }

      const rotated = await transaction.session.updateMany({
        where: {
          id: token.sessionId,
          refreshTokenHash: input.presentedTokenHash,
          revokedAt: null,
          expiresAt: { gt: input.currentTime },
          user: { isActive: true },
        },
        data: {
          refreshTokenHash: input.replacementTokenHash,
          expiresAt: input.replacementExpiresAt,
          lastActivityAt: input.currentTime,
        },
      })

      if (rotated.count !== 1) {
        const latestToken = await transaction.sessionRefreshToken.findUnique({
          where: { tokenHash: input.presentedTokenHash },
          select: { usedAt: true },
        })

        if (latestToken !== null && latestToken.usedAt !== null) {
          await transaction.session.updateMany({
            where: { id: token.sessionId, revokedAt: null },
            data: { revokedAt: input.currentTime },
          })

          return { outcome: 'reused' }
        }

        return { outcome: 'invalid' }
      }

      const consumed = await transaction.sessionRefreshToken.updateMany({
        where: { tokenHash: input.presentedTokenHash, usedAt: null },
        data: { usedAt: input.currentTime },
      })

      if (consumed.count !== 1) {
        await transaction.session.updateMany({
          where: { id: token.sessionId, revokedAt: null },
          data: { revokedAt: input.currentTime },
        })

        return { outcome: 'reused' }
      }

      await transaction.sessionRefreshToken.create({
        data: {
          tokenHash: input.replacementTokenHash,
          sessionId: token.sessionId,
          issuedAt: input.currentTime,
        },
      })

      return {
        outcome: 'rotated',
        userId: token.session.userId,
        sessionId: token.sessionId,
      }
    })
  }

  async revokeOwnedSession(userId: string, sessionId: string, currentTime: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: currentTime },
    })
  }

  async findActiveSessions(userId: string, currentTime: Date): Promise<ActiveSessionView[]> {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: currentTime },
      },
      select: {
        id: true,
        deviceLabel: true,
        lastActivityAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: [{ lastActivityAt: 'desc' }, { id: 'asc' }],
    })
  }
}
