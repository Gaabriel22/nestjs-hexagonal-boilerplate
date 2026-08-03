import { Injectable } from '@nestjs/common'

import type { Credential } from '../../../../domain/entities/credential'
import type { CredentialRepository } from '../../../../domain/repositories/credential.repository'
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service'
import { PrismaCredentialMapper } from '../mappers/prisma-credential.mapper'

@Injectable()
export class PrismaCredentialRepository implements CredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(credential: Credential): Promise<void> {
    const data = PrismaCredentialMapper.toPersistence(credential)

    await this.prisma.credential.upsert({
      where: { userId: credential.userId },
      create: data,
      update: {
        passwordHash: data.passwordHash,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findByUserId(userId: string): Promise<Credential | null> {
    const record = await this.prisma.credential.findUnique({ where: { userId } })

    return record === null ? null : PrismaCredentialMapper.toDomain(record)
  }
}
