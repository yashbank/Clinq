import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  modulePathIgnorePatterns: ["<rootDir>/e2e/"],
};

export default createJestConfig(customJestConfig);
