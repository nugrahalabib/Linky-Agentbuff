import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
    locale: text("locale").notNull().default("id"),
    activeWorkspaceId: text("active_workspace_id"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "admin", "editor", "viewer"] }).notNull().default("editor"),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("wsm_user_idx").on(t.userId)],
);

export const workspaceInvitations = sqliteTable(
  "workspace_invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    email: text("email").notNull(),
    role: text("role", { enum: ["owner", "admin", "editor", "viewer"] }).notNull().default("editor"),
    token: text("token").notNull(),
    invitedBy: text("invited_by"),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    acceptedBy: text("accepted_by"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    uniqueIndex("ws_invite_token_idx").on(t.token),
    index("ws_invite_workspace_idx").on(t.workspaceId),
  ],
);

export const safeBrowsingCache = sqliteTable(
  "safe_browsing_cache",
  {
    urlHash: text("url_hash").primaryKey(),
    verdict: text("verdict", { enum: ["safe", "suspicious", "malicious"] }).notNull(),
    threatTypes: text("threat_types"),
    checkedAt: integer("checked_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("sbc_expires_idx").on(t.expiresAt)],
);

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type SafeBrowsingCache = typeof safeBrowsingCache.$inferSelect;

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan", { enum: ["free", "self_hosted"] })
      .notNull()
      .default("free"),
    ...timestamps,
  },
  (t) => [uniqueIndex("workspaces_slug_idx").on(t.slug), index("workspaces_owner_idx").on(t.ownerId)],
);

export const domains = sqliteTable(
  "domains",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    sslStatus: text("ssl_status", { enum: ["pending", "active", "failed"] })
      .notNull()
      .default("pending"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    verificationToken: text("verification_token"),
    ...timestamps,
  },
  (t) => [uniqueIndex("domains_hostname_idx").on(t.hostname), index("domains_workspace_idx").on(t.workspaceId)],
);

export const folders = sqliteTable(
  "folders",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    name: text("name").notNull(),
    color: text("color").notNull().default("#94A3B8"),
    ...timestamps,
  },
  (t) => [index("folders_workspace_idx").on(t.workspaceId), index("folders_parent_idx").on(t.parentId)],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#4F46E5"),
    ...timestamps,
  },
  (t) => [uniqueIndex("tags_workspace_name_idx").on(t.workspaceId, t.name)],
);

export interface AbVariant {
  url: string;
  weight: number;
  label?: string;
}

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    domainId: text("domain_id").references(() => domains.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    destinationUrl: text("destination_url").notNull(),
    title: text("title"),
    description: text("description"),
    faviconUrl: text("favicon_url"),
    folderId: text("folder_id").references(() => folders.id, { onDelete: "set null" }),
    passwordHash: text("password_hash"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    clickLimit: integer("click_limit"),
    iosUrl: text("ios_url"),
    androidUrl: text("android_url"),
    utmParams: text("utm_params", { mode: "json" }).$type<Record<string, string>>(),
    geoRules: text("geo_rules", { mode: "json" }).$type<Array<{ country: string; url: string }>>(),
    abVariants: text("ab_variants", { mode: "json" }).$type<AbVariant[]>(),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    cloak: integer("cloak", { mode: "boolean" }).notNull().default(false),
    clickCount: integer("click_count").notNull().default(0),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
    anonOwnerIp: text("anon_owner_ip"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("links_domain_slug_idx").on(t.domainId, t.slug),
    uniqueIndex("links_slug_no_domain_idx")
      .on(t.slug)
      .where(sql`${t.domainId} IS NULL`),
    index("links_workspace_idx").on(t.workspaceId),
    index("links_folder_idx").on(t.folderId),
    index("links_created_idx").on(t.createdAt),
    index("links_anon_owner_idx").on(t.anonOwnerIp),
  ],
);

export const linkTags = sqliteTable(
  "link_tags",
  {
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [index("link_tags_link_idx").on(t.linkId), index("link_tags_tag_idx").on(t.tagId)],
);

export const qrCodes = sqliteTable(
  "qr_codes",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    style: text("style", { mode: "json" }).$type<Record<string, unknown>>(),
    logoUrl: text("logo_url"),
    fg: text("fg").notNull().default("#18181B"),
    bg: text("bg").notNull().default("#FFFFFF"),
    shape: text("shape", { enum: ["square", "rounded", "dots"] })
      .notNull()
      .default("square"),
    ...timestamps,
  },
  (t) => [index("qr_link_idx").on(t.linkId)],
);

export const clicks = sqliteTable(
  "clicks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    ts: integer("ts", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    device: text("device"),
    os: text("os"),
    browser: text("browser"),
    referrer: text("referrer"),
    ipHash: text("ip_hash"),
    isBot: integer("is_bot", { mode: "boolean" }).notNull().default(false),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    abVariant: text("ab_variant"),
  },
  (t) => [index("clicks_link_ts_idx").on(t.linkId, t.ts), index("clicks_ts_idx").on(t.ts)],
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("api_keys_hash_idx").on(t.keyHash), index("api_keys_workspace_idx").on(t.workspaceId)],
);

export const abuseReports = sqliteTable(
  "abuse_reports",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    reporterIpHash: text("reporter_ip_hash"),
    status: text("status", { enum: ["open", "reviewing", "resolved", "rejected"] })
      .notNull()
      .default("open"),
    ...timestamps,
  },
  (t) => [index("abuse_link_idx").on(t.linkId), index("abuse_status_idx").on(t.status)],
);

export const utmRecipes = sqliteTable(
  "utm_recipes",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("utm_recipes_workspace_idx").on(t.workspaceId),
    uniqueIndex("utm_recipes_workspace_name_idx").on(t.workspaceId, t.name),
  ],
);

export interface LinkyPageBlock {
  id: string;
  kind: "header" | "link" | "social" | "text" | "divider" | "youtube" | "image" | "countdown";
  data: Record<string, unknown>;
}

export interface LinkyPageTheme {
  preset?: "creator" | "minimal" | "neon" | "student" | "umkm";
  primary?: string;
  background?: string;
  font?: "inter" | "poppins" | "geist";
  buttonStyle?: "filled" | "outline" | "soft" | "glass";
}

export const linkyPages = sqliteTable(
  "linky_pages",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    theme: text("theme", { mode: "json" }).$type<LinkyPageTheme>(),
    background: text("background"),
    blocks: text("blocks", { mode: "json" })
      .$type<LinkyPageBlock[]>()
      .notNull()
      .default(sql`'[]'`),
    views: integer("views").notNull().default(0),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("linky_pages_slug_idx").on(t.slug), index("linky_pages_workspace_idx").on(t.workspaceId)],
);

export const linkyPageClicks = sqliteTable(
  "linky_page_clicks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pageId: text("page_id")
      .notNull()
      .references(() => linkyPages.id, { onDelete: "cascade" }),
    blockId: text("block_id"),
    ts: integer("ts", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    referrer: text("referrer"),
    country: text("country"),
    ipHash: text("ip_hash"),
  },
  (t) => [index("lpc_page_idx").on(t.pageId, t.ts)],
);

export const webhooks = sqliteTable(
  "webhooks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: text("events", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'["link.clicked"]'`),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    lastDeliveryAt: integer("last_delivery_at", { mode: "timestamp_ms" }),
    lastStatusCode: integer("last_status_code"),
    failureCount: integer("failure_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("webhooks_workspace_idx").on(t.workspaceId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Click = typeof clicks.$inferSelect;
export type NewClick = typeof clicks.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Domain = typeof domains.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type UtmRecipe = typeof utmRecipes.$inferSelect;
export type LinkyPage = typeof linkyPages.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type AbuseReport = typeof abuseReports.$inferSelect;
