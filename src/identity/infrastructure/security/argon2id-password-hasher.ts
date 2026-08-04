import { Injectable } from '@nestjs/common'
import { argon2id, hash } from 'argon2'

import type { PasswordHasher } from '../../application/ports/password-hasher'

@Injectable()
export class Argon2idPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, {
      type: argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
      hashLength: 32,
    })
  }
}
