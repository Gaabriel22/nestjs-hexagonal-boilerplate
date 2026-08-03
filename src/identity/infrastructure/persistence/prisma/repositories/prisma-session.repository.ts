import { Injectable } from '@nestjs/common'

import type { IdentitySession } from '../../../../domain/entities/identity-session'
import type { SessionRepository } from '../../../../domain/repositories/session.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaSessionMapper } from '../mappers/prisma-session.mapper'

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(session: IdentitySession): Promise<void> {
    const data = PrismaSessionMapper.toPersistence(session)

    await this.prisma.session.upsert({
      where: { id: session.id },
      create: data,
      update: {
        refreshTokenHash: data.refreshTokenHash,
        deviceLabel: data.deviceLabel,
        lastActivityAt: data.lastActivityAt,
        expiresAt: data.expiresAt,
        revokedAt: data.revokedAt,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findByIdForUser(id: string, userId: string): Promise<IdentitySession | null> {
    const record = await this.prisma.session.findFirst({ where: { id, userId } })

    return record === null ? null : PrismaSessionMapper.toDomain(record)
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<IdentitySession | null> {
    const record = await this.prisma.session.findUnique({ where: { refreshTokenHash } })

    return record === null ? null : PrismaSessionMapper.toDomain(record)
  }

  async findActiveByUserId(userId: string, currentTime: Date): Promise<IdentitySession[]> {
    const records = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: currentTime },
      },
      orderBy: { lastActivityAt: 'desc' },
    })

    return records.map((record) => PrismaSessionMapper.toDomain(record))
  }
}
