const FIXED_ISO_DATE = '2026-01-01T00:00:00.000Z'

export function createDeterministicIdFactory(prefix = 'test-id'): () => string {
  let sequence = 0

  return (): string => {
    sequence += 1
    return `${prefix}-${sequence.toString().padStart(4, '0')}`
  }
}

export function createFixedDate(): Date {
  return new Date(FIXED_ISO_DATE)
}
