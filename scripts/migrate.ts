#!/usr/bin/env node
/**
 * Auto-select SQLite or Postgres migration based on DATABASE_URL.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./linky.db";
const isPostgres = url.startsWith("postgres");
const script = isPostgres ? "migrate-pg.ts" : "migrate-sqlite.ts";
const target = path.join(__dirname, script);

console.log(`[migrate] using ${isPostgres ? "Postgres" : "SQLite"} -> ${script}`);

const tsx = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
const res = spawnSync(tsx, [target], { stdio: "inherit", env: process.env });
process.exit(res.status ?? 0);
