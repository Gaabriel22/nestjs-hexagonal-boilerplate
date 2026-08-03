import { spawnSync } from 'node:child_process'

import { resolveTestDatabaseUrl } from './test-database-guard'

function prepareTestDatabase(): void {
  const testDatabaseUrl = resolveTestDatabaseUrl(process.env)
  const prismaCliPath = require.resolve('prisma/build/index.js')
  const result = spawnSync(process.execPath, [prismaCliPath, 'migrate', 'reset', '--force'], {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
    stdio: 'inherit',
  })

  if (result.error !== undefined) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`Prisma migration reset failed with exit code ${String(result.status)}`)
  }
}

prepareTestDatabase()
