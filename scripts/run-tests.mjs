#!/usr/bin/env node
/**
 * Lightweight cross-platform test runner using Node's built-in test runner + tsx.
 * Avoids rollup/rolldown native deps (Windows App Control compatible).
 */
import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const TEST_DIRS = ["src/lib", "src/lib/cache"];

function collectTests(dir) {
  const entries = readdirSync(dir);
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e);
    const s = statSync(full);
    if (s.isDirectory()) results.push(...collectTests(full));
    else if (e.endsWith(".test.ts")) results.push(full);
  }
  return results;
}

const files = new Set();
for (const d of TEST_DIRS) {
  try {
    for (const f of collectTests(d)) files.add(f);
  } catch {
    /* dir missing */
  }
}

if (files.size === 0) {
  console.error("[test] no tests found");
  process.exit(1);
}

const args = ["--test", "--test-reporter=spec", ...files];
const isWin = process.platform === "win32";
const tsx = path.join(process.cwd(), "node_modules", ".bin", isWin ? "tsx.cmd" : "tsx");
const child = spawn(tsx, args, { stdio: "inherit", env: process.env, shell: isWin });
child.on("exit", (code) => process.exit(code ?? 0));
