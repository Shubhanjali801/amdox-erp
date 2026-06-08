/** @type {import("jest").Config} */
module.exports = {
  preset:              'ts-jest',
  testEnvironment:     'node',
  roots:               ['<rootDir>/tests'],
  moduleNameMapper:    { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageReporters:   ['text','lcov'],
  testTimeout:         30000,
  setupFilesAfterFramework: ['<rootDir>/tests/__mocks__/database.mock.ts'],
};
