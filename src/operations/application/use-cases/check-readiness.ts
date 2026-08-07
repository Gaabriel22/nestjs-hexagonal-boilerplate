import type { ReadinessProbe } from '../ports/readiness-probe'

export interface ReadinessResult {
  readonly status: 'ready' | 'not_ready'
  readonly checks: {
    readonly postgresql: 'up' | 'down'
  }
}

export class CheckReadiness {
  constructor(
    private readonly probe: ReadinessProbe,
    private readonly timeoutMilliseconds: number,
  ) {}

  async execute(): Promise<ReadinessResult> {
    let timeout: NodeJS.Timeout | undefined

    try {
      await Promise.race([
        this.probe.check(),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Readiness check timed out')),
            this.timeoutMilliseconds,
          )
        }),
      ])

      return {
        status: 'ready',
        checks: { postgresql: 'up' },
      }
    } catch {
      return {
        status: 'not_ready',
        checks: { postgresql: 'down' },
      }
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout)
      }
    }
  }
}
