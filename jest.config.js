/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/*.test.ts"],
	moduleFileExtensions: ["ts", "js", "json"],
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov"],
	transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
	moduleNameMapper: {
		"^uuid$": require.resolve("uuid"),
	},
	setupFiles: ["<rootDir>/src/setupTests.ts"],
};
