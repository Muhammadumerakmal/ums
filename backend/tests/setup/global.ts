// Vitest global setup — runs before the test suites.
// Provides hermetic auth config so unit tests don't depend on a real .env.
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-please-change";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS ?? "4"; // low cost = fast tests
