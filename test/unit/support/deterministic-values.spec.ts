import { createDeterministicIdFactory, createFixedDate } from '../../support/deterministic-values'

describe('deterministic test values', () => {
  it('creates repeatable identifier sequences', () => {
    const createId = createDeterministicIdFactory('user')

    expect([createId(), createId()]).toEqual(['user-0001', 'user-0002'])
  })

  it('returns independent dates with the same value', () => {
    const firstDate = createFixedDate()
    const secondDate = createFixedDate()

    firstDate.setUTCFullYear(2030)

    expect(secondDate.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })
})
