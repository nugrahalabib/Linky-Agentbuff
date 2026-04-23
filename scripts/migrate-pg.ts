import postgres from "postgres";

const MIGRATIONS = [
  {
    id: "0000_initial_pg",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        email_verified_at TIMESTAMPTZ,
        locale TEXT NOT NULL DEFAULT 'id',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL DEFAULT 'free',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);
      CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces(owner_id);

      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        hostname TEXT NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT false,
        ssl_status TEXT NOT NULL DEFAULT 'pending',
        is_default BOOLEAN NOT NULL DEFAULT false,
        verification_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS domains_hostname_idx ON domains(hostname);
      CREATE INDEX IF NOT EXISTS domains_workspace_idx ON domains(workspace_id);

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        parent_id TEXT,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#94A3B8',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS folders_workspace_idx ON folders(workspace_id);
      CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders(parent_id);

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#4F46E5',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
        expires_at TIMESTAMPTZ,
        click_limit INTEGER,
        ios_url TEXT,
        android_url TEXT,
        utm_params JSONB,
        geo_rules JSONB,
        click_count INTEGER NOT NULL DEFAULT 0,
        archived BOOLEAN NOT NULL DEFAULT false,
        is_anonymous BOOLEAN NOT NULL DEFAULT false,
        anon_owner_ip TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
        style JSONB,
        logo_url TEXT,
        fg TEXT NOT NULL DEFAULT '#18181B',
        bg TEXT NOT NULL DEFAULT '#FFFFFF',
        shape TEXT NOT NULL DEFAULT 'square',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS qr_link_idx ON qr_codes(link_id);

      CREATE TABLE IF NOT EXISTS clicks (
        id BIGSERIAL PRIMARY KEY,
        link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        ts TIMESTAMPTZ NOT NULL DEFAULT now(),
        country TEXT,
        region TEXT,
        city TEXT,
        device TEXT,
        os TEXT,
        browser TEXT,
        referrer TEXT,
        ip_hash TEXT,
        is_bot BOOLEAN NOT NULL DEFAULT false,
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
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);
      CREATE INDEX IF NOT EXISTS api_keys_workspace_idx ON api_keys(workspace_id);

      CREATE TABLE IF NOT EXISTS abuse_reports (
        id TEXT PRIMARY KEY,
        link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        reporter_ip_hash TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS abuse_link_idx ON abuse_reports(link_id);
      CREATE INDEX IF NOT EXISTS abuse_status_idx ON abuse_reports(status);
    `,
  },
];

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("postgres")) {
    console.error("[migrate-pg] DATABASE_URL must be postgres:// — skipping");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS __migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`);
    const applied = new Set<string>(
      (await sql<{ id: string }[]>`SELECT id FROM __migrations`).map((r) => r.id),
    );
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      await sql.begin(async (tx) => {
        await tx.unsafe(m.sql);
        await tx`INSERT INTO __migrations (id) VALUES (${m.id})`;
      });
      console.log(`[migrate-pg] applied ${m.id}`);
    }
    console.log(`[migrate-pg] up-to-date (${MIGRATIONS.length} total)`);
  } finally {
    await sql.end();
  }
}

run().catch((e) => {
  console.error("[migrate-pg] error:", e);
  process.exit(1);
});
