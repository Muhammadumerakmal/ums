import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../models/schema";

/**
 * Neon serverless + Drizzle client.
 *
 * Uses the HTTP driver, which suits short-lived serverless invocations. Initialization is
 * LAZY (deferred to first query) so that importing this module during `next build` does not
 * require the connection string to be present. `DATABASE_URL_TEST` is preferred under Vitest
 * so integration tests never touch the development database.
 */
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let client: DrizzleClient | null = null;

function initClient(): DrizzleClient {
  const connectionString =
    process.env.NODE_ENV === "test" && process.env.DATABASE_URL_TEST
      ? process.env.DATABASE_URL_TEST
      : process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }
  return drizzle(neon(connectionString), { schema });
}

/** Lazily-initialized Drizzle client. Connects on first property access, not at import. */
export const db = new Proxy({} as DrizzleClient, {
  get(_target, prop, receiver) {
    if (!client) client = initClient();
    return Reflect.get(client, prop, receiver);
  },
});

export type DB = DrizzleClient;
