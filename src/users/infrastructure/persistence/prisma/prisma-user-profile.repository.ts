import { Injectable } from '@nestjs/common'

import type {
  UserProfile,
  UserProfileRepository,
} from '../../../application/ports/user-profile.repository'
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service'

const PROFILE_SELECTION = {
  id: true,
  normalizedEmail: true,
  displayName: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class PrismaUserProfileRepository implements UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveById(userId: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: PROFILE_SELECTION,
    })

    return user === null ? null : toProfile(user)
  }

  async updateDisplayName(
    userId: string,
    displayName: string,
    updatedAt: Date,
  ): Promise<UserProfile | null> {
    const updated = await this.prisma.user.updateMany({
      where: { id: userId, isActive: true },
      data: { displayName, updatedAt },
    })

    if (updated.count !== 1) {
      return null
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: PROFILE_SELECTION,
    })

    return user === null ? null : toProfile(user)
  }
}

function toProfile(user: {
  readonly id: string
  readonly normalizedEmail: string
  readonly displayName: string | null
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}): UserProfile {
  return {
    id: user.id,
    email: user.normalizedEmail,
    displayName: user.displayName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
