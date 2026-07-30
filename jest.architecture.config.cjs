const base = require('./jest.base.config.cjs')

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'architecture',
  testMatch: ['<rootDir>/test/architecture/**/*.architecture-spec.ts'],
}
