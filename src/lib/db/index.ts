import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

/**
 * Database: SQLite (WAL) with sync drizzle API (`.get()/.all()/.run()`).
 *
 * A production Postgres adapter is prepared (see `schema-pg.ts` + `migrate-pg.ts`)
 * and a dedicated Postgres database is provisioned on the VPS, but call sites
 * currently rely on synchronous SQLite semantics. Migration to async Postgres is
 * tracked as a follow-up phase and will convert all `db.select()...get()` patterns
 * to awaitable queries behind a unified repository layer.
 */

type DbKind = "sqlite" | "postgres";

export function detectKind(url: string | undefined): DbKind {
  if (!url) return "sqlite";
  return url.startsWith("postgres") ? "postgres" : "sqlite";
}

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./linky.db";
const resolvedKind = detectKind(DATABASE_URL);
export const dbKind: DbKind = resolvedKind === "postgres" ? "postgres" : "sqlite";

function getSqliteFile(): string {
  // If a postgres URL is provided we still fall back to a local SQLite file so
  // the app doesn't crash — surface-level warn so operators notice during deploy.
  if (resolvedKind === "postgres") {
    console.warn(
      "[db] postgres URL detected but runtime still uses SQLite. Migration pending.",
    );
    return path.resolve(process.cwd(), "linky.db");
  }
  const cleaned = DATABASE_URL.startsWith("file:") ? DATABASE_URL.slice(5) : DATABASE_URL;
  return path.resolve(process.cwd(), cleaned);
}

const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

function createSqlite(): Database.Database {
  if (globalForDb.sqlite) return globalForDb.sqlite;
  const sqlite = new Database(getSqliteFile());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  globalForDb.sqlite = sqlite;
  return sqlite;
}

export const sqlite = createSqlite();
export const db = drizzle(sqlite, { schema });

export async function pingDb(): Promise<boolean> {
  try {
    sqlite.prepare("SELECT 1").get();
    return true;
  } catch {
    return false;
  }
}

export { schema };
export type DB = typeof db;
export * from "./schema";
