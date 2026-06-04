import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database: PostgreSQL via postgres-js with the async Drizzle API.
 * postgres-js is pure-JS (no native binding — sidesteps the Windows App Control issue that
 * previously forced better-sqlite3) and connects LAZILY: importing this module does not open a
 * connection until the first query runs, so pure-function unit tests don't need a live DB.
 * DDL is applied via scripts/migrate-pg.ts. The legacy SQLite schema is archived in schema-sqlite.ts.
 */

export const dbKind = "postgres" as const;

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://linky_user@127.0.0.1:5434/linky";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? postgres(DATABASE_URL, { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const sql = client;
export const db = drizzle(client, { schema });

export async function pingDb(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export { schema };
export type DB = typeof db;
export * from "./schema";
