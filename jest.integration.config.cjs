const base = require('./jest.base.config.cjs')

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'integration',
  setupFiles: ['<rootDir>/test/support/setup-environment.ts'],
  testMatch: ['<rootDir>/test/integration/**/*.integration-spec.ts'],
}
