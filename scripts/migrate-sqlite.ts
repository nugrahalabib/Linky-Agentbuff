import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./linky.db";
  const cleaned = url.startsWith("file:") ? url.slice(5) : url;
  return path.resolve(process.cwd(), cleaned);
}

const MIGRATIONS = [
  {
    id: "0000_initial",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        email_verified_at INTEGER,
        locale TEXT NOT NULL DEFAULT 'id',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL DEFAULT 'free',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);
      CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces(owner_id);

      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        hostname TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        ssl_status TEXT NOT NULL DEFAULT 'pending',
        is_default INTEGER NOT NULL DEFAULT 0,
        verification_token TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS domains_hostname_idx ON domains(hostname);
      CREATE INDEX IF NOT EXISTS domains_workspace_idx ON domains(workspace_id);

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        parent_id TEXT,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#94A3B8',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS folders_workspace_idx ON folders(workspace_id);
      CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders(parent_id);

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#4F46E5',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS tags_workspace_name_idx ON tags(workspace_id, name);

      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
        domain_id TEXT REFERENCES domains(id) ON DELETE SET NULL,
        slug TEXT NOT NULL,
        destination_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        favicon_url TEXT,
        folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
        password_hash TEXT,
        expires_at INTEGER,
        click_limit INTEGER,
        ios_url TEXT,
        android_url TEXT,
        utm_params TEXT,
        geo_rules TEXT,
        click_count INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        is_anonymous INTEGER NOT NULL DEFAULT 0,
        anon_owner_ip TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS links_domain_slug_idx ON links(domain_id, slug);
      CREATE UNIQUE INDEX IF NOT EXISTS links_slug_no_domain_idx ON links(slug) WHERE domain_id IS NULL;
      CREATE INDEX IF NOT EXISTS links_workspace_idx ON links(workspace_id);
      CREATE INDEX IF NOT EXISTS links_folder_idx ON links(folder_id);
      CREATE INDEX IF NOT EXISTS links_created_idx ON links(created_at);
      CREATE INDEX IF NOT EXISTS links_anon_owner_idx ON links(anon_owner_ip);

      CREATE TABLE IF NOT EXISTS link_tags (
        link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (link_id, tag_id)
      );
      CREATE INDEX IF NOT EXISTS link_tags_link_idx ON link_tags(link_id);
      CREATE INDEX IF NOT EXISTS link_tags_tag_idx ON link_tags(tag_id);

      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        style TEXT,
        logo_url TEXT,
        fg TEXT NOT NULL DEFAULT '#18181B',
        bg TEXT NOT NULL DEFAULT '#FFFFFF',
        shape TEXT NOT NULL DEFAULT 'square',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS qr_link_idx ON qr_codes(link_id);

      CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        ts INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        country TEXT,
        region TEXT,
        city TEXT,
        device TEXT,
        os TEXT,
        browser TEXT,
        referrer TEXT,
        ip_hash TEXT,
        is_bot INTEGER NOT NULL DEFAULT 0,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT
      );
      CREATE INDEX IF NOT EXISTS clicks_link_ts_idx ON clicks(link_id, ts);
      CREATE INDEX IF NOT EXISTS clicks_ts_idx ON clicks(ts);

      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        last_used_at INTEGER,
        expires_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);
      CREATE INDEX IF NOT EXISTS api_keys_workspace_idx ON api_keys(workspace_id);

      CREATE TABLE IF NOT EXISTS abuse_reports (
        id TEXT PRIMARY KEY,
        link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        reporter_ip_hash TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS abuse_link_idx ON abuse_reports(link_id);
      CREATE INDEX IF NOT EXISTS abuse_status_idx ON abuse_reports(status);

      CREATE TABLE IF NOT EXISTS __migrations (
        id TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
    `,
  },
  {
    id: "0001_utm_recipes",
    sql: `
      CREATE TABLE IF NOT EXISTS utm_recipes (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_term TEXT,
        utm_content TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS utm_recipes_workspace_idx ON utm_recipes(workspace_id);
      CREATE UNIQUE INDEX IF NOT EXISTS utm_recipes_workspace_name_idx ON utm_recipes(workspace_id, name);
    `,
  },
  {
    id: "0002_link_og_override",
    sql: `
      ALTER TABLE links ADD COLUMN og_title TEXT;
      ALTER TABLE links ADD COLUMN og_description TEXT;
      ALTER TABLE links ADD COLUMN og_image TEXT;
      ALTER TABLE links ADD COLUMN cloak INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    id: "0003_ab_variants",
    sql: `
      ALTER TABLE links ADD COLUMN ab_variants TEXT;
      ALTER TABLE clicks ADD COLUMN ab_variant TEXT;
      CREATE INDEX IF NOT EXISTS clicks_ab_idx ON clicks(link_id, ab_variant);
    `,
  },
  {
    id: "0004_linky_pages",
    sql: `
      CREATE TABLE IF NOT EXISTS linky_pages (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        theme TEXT,
        background TEXT,
        blocks TEXT NOT NULL DEFAULT '[]',
        views INTEGER NOT NULL DEFAULT 0,
        published INTEGER NOT NULL DEFAULT 1,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS linky_pages_slug_idx ON linky_pages(slug);
      CREATE INDEX IF NOT EXISTS linky_pages_workspace_idx ON linky_pages(workspace_id);

      CREATE TABLE IF NOT EXISTS linky_page_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT NOT NULL REFERENCES linky_pages(id) ON DELETE CASCADE,
        block_id TEXT,
        ts INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        referrer TEXT,
        country TEXT,
        ip_hash TEXT
      );
      CREATE INDEX IF NOT EXISTS lpc_page_idx ON linky_page_clicks(page_id, ts);
    `,
  },
  {
    id: "0005_webhooks",
    sql: `
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        secret TEXT NOT NULL,
        events TEXT NOT NULL DEFAULT '["link.clicked"]',
        active INTEGER NOT NULL DEFAULT 1,
        last_delivery_at INTEGER,
        last_status_code INTEGER,
        failure_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS webhooks_workspace_idx ON webhooks(workspace_id);
    `,
  },
  {
    id: "0006_workspace_members",
    sql: `
      CREATE TABLE IF NOT EXISTS workspace_members (
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'editor',
        joined_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        PRIMARY KEY (workspace_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS wsm_user_idx ON workspace_members(user_id);

      CREATE TABLE IF NOT EXISTS workspace_invitations (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        token TEXT NOT NULL,
        invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        accepted_at INTEGER,
        accepted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ws_invite_token_idx ON workspace_invitations(token);
      CREATE INDEX IF NOT EXISTS ws_invite_workspace_idx ON workspace_invitations(workspace_id);
    `,
  },
  {
    id: "0007_active_workspace",
    sql: `
      ALTER TABLE users ADD COLUMN active_workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL;
    `,
  },
  {
    id: "0008_safe_browsing_cache",
    sql: `
      CREATE TABLE IF NOT EXISTS safe_browsing_cache (
        url_hash TEXT PRIMARY KEY,
        verdict TEXT NOT NULL,
        threat_types TEXT,
        checked_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sbc_expires_idx ON safe_browsing_cache(expires_at);
    `,
  },
  {
    id: "0009_webhook_deliveries",
    sql: `
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
        event TEXT NOT NULL,
        status_code INTEGER,
        success INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER,
        error TEXT,
        request_body TEXT,
        response_snippet TEXT,
        ts INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS whd_webhook_idx ON webhook_deliveries(webhook_id, ts);
    `,
  },
];

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function run(): void {
  const dbPath = getDbPath();
  ensureDir(dbPath);
  const sqlite = new Database(dbPath);
  try {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.exec(`CREATE TABLE IF NOT EXISTS __migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );`);
    const applied = new Set<string>(
      sqlite.prepare("SELECT id FROM __migrations").all().map((r) => (r as { id: string }).id),
    );
    const insert = sqlite.prepare("INSERT INTO __migrations (id) VALUES (?)");
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      const tx = sqlite.transaction(() => {
        sqlite.exec(m.sql);
        insert.run(m.id);
      });
      tx();
      console.log(`[migrate-sqlite] applied ${m.id}`);
    }
    console.log(`[migrate-sqlite] up-to-date (${MIGRATIONS.length} total)`);
  } finally {
    sqlite.close();
  }
}

run();
