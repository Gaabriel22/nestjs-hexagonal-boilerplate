import { randomUUID } from 'node:crypto'

const REQUEST_IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/i

export function isValidRequestIdentifier(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_IDENTIFIER_PATTERN.test(value)
}

export function resolveRequestIdentifier(value: unknown): string {
  return isValidRequestIdentifier(value) ? value : randomUUID()
}
