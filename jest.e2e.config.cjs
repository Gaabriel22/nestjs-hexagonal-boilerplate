const base = require('./jest.base.config.cjs')

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'e2e',
  setupFiles: ['<rootDir>/test/support/setup-environment.ts'],
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
}
