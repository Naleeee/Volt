/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  roots: ["<rootDir>/src"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  clearMocks: true,
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/db/**/*.ts",
    "!**/__tests__/**",
    "!**/__mocks__/**",
    "!src/db/drizzle/**",
  ],
  coverageReporters: ["text", "json-summary"],
};
