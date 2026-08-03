export class UnsafeTestDatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = UnsafeTestDatabaseError.name
  }
}

const SAFE_DATABASE_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]*_(?:test|testing)$/i
const FORBIDDEN_DATABASE_NAMES = new Set(['postgres', 'template0', 'template1'])

function parseDatabaseUrl(value: string): URL {
  try {
    return new URL(value)
  } catch {
    throw new UnsafeTestDatabaseError('TEST_DATABASE_URL must be a valid PostgreSQL URL')
  }
}

function getDatabaseName(url: URL): string {
  return decodeURIComponent(url.pathname.replace(/^\/+/, ''))
}

export function assertSafeTestDatabaseUrl(
  testDatabaseUrl: string,
  applicationDatabaseUrl?: string,
): void {
  const parsedTestUrl = parseDatabaseUrl(testDatabaseUrl)

  if (!['postgres:', 'postgresql:'].includes(parsedTestUrl.protocol)) {
    throw new UnsafeTestDatabaseError('TEST_DATABASE_URL must use PostgreSQL')
  }

  const databaseName = getDatabaseName(parsedTestUrl)

  if (
    databaseName.length === 0 ||
    FORBIDDEN_DATABASE_NAMES.has(databaseName.toLowerCase()) ||
    !SAFE_DATABASE_NAME_PATTERN.test(databaseName)
  ) {
    throw new UnsafeTestDatabaseError('Test database name must end with _test or _testing')
  }

  if (applicationDatabaseUrl !== undefined) {
    const parsedApplicationUrl = parseDatabaseUrl(applicationDatabaseUrl)

    if (parsedApplicationUrl.href === parsedTestUrl.href) {
      throw new UnsafeTestDatabaseError(
        'TEST_DATABASE_URL must differ from the application database',
      )
    }
  }
}

export function resolveTestDatabaseUrl(environment: NodeJS.ProcessEnv): string {
  if (environment.NODE_ENV !== 'test') {
    throw new UnsafeTestDatabaseError('Database test preparation requires NODE_ENV=test')
  }

  const testDatabaseUrl = environment.TEST_DATABASE_URL

  if (testDatabaseUrl === undefined || testDatabaseUrl.length === 0) {
    throw new UnsafeTestDatabaseError('TEST_DATABASE_URL is required')
  }

  assertSafeTestDatabaseUrl(testDatabaseUrl, environment.DATABASE_URL)

  return testDatabaseUrl
}
