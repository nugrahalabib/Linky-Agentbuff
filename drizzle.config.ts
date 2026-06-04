import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://linky_user@127.0.0.1:5434/linky",
  },
  verbose: true,
  strict: true,
} satisfies Config;
