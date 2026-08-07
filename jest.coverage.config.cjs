const unit = require('./jest.unit.config.cjs')

/** @type {import('jest').Config} */
module.exports = {
  ...unit,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/domain/**/*.ts', 'src/**/application/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 80,
      lines: 90,
      statements: 90,
    },
  },
  displayName: 'coverage',
}
