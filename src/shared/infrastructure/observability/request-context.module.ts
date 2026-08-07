import { Global, Module } from '@nestjs/common'

import { REQUEST_CONTEXT } from '../../application/ports/request-context'
import { AsyncLocalRequestContext } from './async-local-request-context'

export const requestContextStorage = new AsyncLocalRequestContext()

@Global()
@Module({
  providers: [
    { provide: AsyncLocalRequestContext, useValue: requestContextStorage },
    { provide: REQUEST_CONTEXT, useExisting: AsyncLocalRequestContext },
  ],
  exports: [AsyncLocalRequestContext, REQUEST_CONTEXT],
})
export class RequestContextModule {}
