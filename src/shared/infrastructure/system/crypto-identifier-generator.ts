import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import type { IdentifierGenerator } from '../../application/ports/identifier-generator'

@Injectable()
export class CryptoIdentifierGenerator implements IdentifierGenerator {
  generate(): string {
    return randomUUID()
  }
}
