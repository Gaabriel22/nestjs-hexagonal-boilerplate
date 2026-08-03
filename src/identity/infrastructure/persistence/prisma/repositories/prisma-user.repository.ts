import { Injectable } from '@nestjs/common'

import type { IdentityUser } from '../../../../domain/entities/identity-user'
import type { UserRepository } from '../../../../domain/repositories/user.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaUserMapper } from '../mappers/prisma-user.mapper'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: IdentityUser): Promise<void> {
    const data = PrismaUserMapper.toPersistence(user)

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: {
        normalizedEmail: data.normalizedEmail,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findById(id: string): Promise<IdentityUser | null> {
    const record = await this.prisma.user.findUnique({ where: { id } })

    return record === null ? null : PrismaUserMapper.toDomain(record)
  }

  async findByNormalizedEmail(normalizedEmail: string): Promise<IdentityUser | null> {
    const record = await this.prisma.user.findUnique({ where: { normalizedEmail } })

    return record === null ? null : PrismaUserMapper.toDomain(record)
  }
}
