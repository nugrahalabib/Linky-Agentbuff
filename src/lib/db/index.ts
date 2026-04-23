import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./linky.db";
  const cleaned = url.startsWith("file:") ? url.slice(5) : url;
  return path.resolve(process.cwd(), cleaned);
}

function createSqlite(): Database.Database {
  if (globalForDb.sqlite) return globalForDb.sqlite;
  const sqlite = new Database(getDbPath());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  globalForDb.sqlite = sqlite;
  return sqlite;
}

export const sqlite = createSqlite();
export const db = drizzle(sqlite, { schema });
export { schema };
export type DB = typeof db;
