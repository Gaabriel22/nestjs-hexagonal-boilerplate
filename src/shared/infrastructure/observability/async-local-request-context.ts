import { AsyncLocalStorage } from 'node:async_hooks'

import type { RequestContext } from '../../application/ports/request-context'

interface RequestContextStore {
  readonly requestIdentifier: string
}

export class AsyncLocalRequestContext implements RequestContext {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>()

  run(requestIdentifier: string, callback: () => void): void {
    this.storage.run({ requestIdentifier }, callback)
  }

  getRequestIdentifier(): string | null {
    return this.storage.getStore()?.requestIdentifier ?? null
  }
}
