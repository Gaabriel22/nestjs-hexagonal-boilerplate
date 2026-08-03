import {
  assertSafeTestDatabaseUrl,
  resolveTestDatabaseUrl,
  UnsafeTestDatabaseError,
} from '../../support/test-database-guard'

describe('test database guard', () => {
  it.each([
    'postgresql://app:secret@localhost:5432/app_test',
    'postgres://app:secret@database:5432/service_testing',
  ])('accepts a dedicated PostgreSQL test database: %s', (databaseUrl) => {
    expect(() => assertSafeTestDatabaseUrl(databaseUrl)).not.toThrow()
  })

  it.each([
    'postgresql://app:secret@localhost:5432/app',
    'postgresql://app:secret@localhost:5432/postgres',
    'mysql://app:secret@localhost:3306/app_test',
    'not-a-url',
  ])('rejects an unsafe target without exposing credentials: %s', (databaseUrl) => {
    let thrownError: unknown

    try {
      assertSafeTestDatabaseUrl(databaseUrl)
    } catch (error) {
      thrownError = error
    }

    expect(thrownError).toBeInstanceOf(UnsafeTestDatabaseError)
    expect(String(thrownError)).not.toContain('secret')
  })

  it('rejects the application database even when its name looks test-only', () => {
    const databaseUrl = 'postgresql://app:secret@localhost:5432/app_test'

    expect(() => assertSafeTestDatabaseUrl(databaseUrl, databaseUrl)).toThrow(
      'TEST_DATABASE_URL must differ from the application database',
    )
  })

  it('requires an explicit test environment and target', () => {
    expect(() =>
      resolveTestDatabaseUrl({
        NODE_ENV: 'development',
        TEST_DATABASE_URL: 'postgresql://app:secret@localhost:5432/app_test',
      }),
    ).toThrow('Database test preparation requires NODE_ENV=test')

    expect(() => resolveTestDatabaseUrl({ NODE_ENV: 'test' })).toThrow(
      'TEST_DATABASE_URL is required',
    )
  })
})
