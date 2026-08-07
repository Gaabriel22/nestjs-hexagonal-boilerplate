import type { ReadinessProbe } from '../../../src/operations/application/ports/readiness-probe'
import { CheckReadiness } from '../../../src/operations/application/use-cases/check-readiness'

describe('CheckReadiness', () => {
  it('reports PostgreSQL as ready when the probe succeeds', async () => {
    const probe = probeThatResolves()

    await expect(new CheckReadiness(probe, 100).execute()).resolves.toEqual({
      status: 'ready',
      checks: { postgresql: 'up' },
    })
  })

  it('reports PostgreSQL as unavailable without leaking the probe failure', async () => {
    const probe: ReadinessProbe = {
      check: (): Promise<void> =>
        Promise.reject(new Error('postgresql://user:secret@database/internal')),
    }

    await expect(new CheckReadiness(probe, 100).execute()).resolves.toEqual({
      status: 'not_ready',
      checks: { postgresql: 'down' },
    })
  })

  it('bounds a probe that never settles', async () => {
    const probe: ReadinessProbe = {
      check: (): Promise<void> => new Promise(() => undefined),
    }
    const startedAt = performance.now()

    await expect(new CheckReadiness(probe, 10).execute()).resolves.toMatchObject({
      status: 'not_ready',
    })
    expect(performance.now() - startedAt).toBeLessThan(250)
  })

  function probeThatResolves(): ReadinessProbe {
    return {
      check: (): Promise<void> => Promise.resolve(),
    }
  }
})
