import { Module } from '@nestjs/common'

import { IdentityModule } from '../identity/identity.module'
import { CLOCK, type Clock } from '../shared/application/ports/clock'
import { SystemClock } from '../shared/infrastructure/system/system-clock'
import {
  USER_PROFILE_REPOSITORY,
  type UserProfileRepository,
} from './application/ports/user-profile.repository'
import { GetCurrentUserProfile } from './application/use-cases/get-current-user-profile'
import { UpdateCurrentUserProfile } from './application/use-cases/update-current-user-profile'
import { UsersController } from './infrastructure/http/users.controller'
import { PrismaUserProfileRepository } from './infrastructure/persistence/prisma/prisma-user-profile.repository'

@Module({
  imports: [IdentityModule],
  controllers: [UsersController],
  providers: [
    PrismaUserProfileRepository,
    SystemClock,
    { provide: USER_PROFILE_REPOSITORY, useExisting: PrismaUserProfileRepository },
    { provide: CLOCK, useExisting: SystemClock },
    {
      provide: GetCurrentUserProfile,
      inject: [USER_PROFILE_REPOSITORY],
      useFactory: (repository: UserProfileRepository): GetCurrentUserProfile =>
        new GetCurrentUserProfile(repository),
    },
    {
      provide: UpdateCurrentUserProfile,
      inject: [USER_PROFILE_REPOSITORY, CLOCK],
      useFactory: (repository: UserProfileRepository, clock: Clock): UpdateCurrentUserProfile =>
        new UpdateCurrentUserProfile(repository, clock),
    },
  ],
})
export class UsersModule {}
