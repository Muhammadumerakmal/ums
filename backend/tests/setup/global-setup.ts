import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

/**
 * Vitest globalSetup — runs ONCE before all suites.
 * If DATABASE_URL_TEST is configured, migrate the test database so integration
 * tests have an up-to-date schema. When it is absent, integration suites skip.
 */
export default async function globalSetup() {
  if (!process.env.DATABASE_URL_TEST) {
    console.warn("[tests] DATABASE_URL_TEST not set — integration tests will be skipped.");
    return;
  }
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");
  const db = drizzle(neon(process.env.DATABASE_URL_TEST));
  await migrate(db, { migrationsFolder: "drizzle" });
}
