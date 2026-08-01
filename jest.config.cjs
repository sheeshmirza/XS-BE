module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/routes/v1/authRoutes.ts",
    "src/controllers/authController.ts",
    "src/middleware/auth.ts",
    "src/services/authService.ts",
    "src/validations/authValidation.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
