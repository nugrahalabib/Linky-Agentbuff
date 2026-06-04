import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    image: text("image"),
    oauthProvider: text("oauth_provider"),
    oauthSubject: text("oauth_subject"),
    emailVerifiedAt: timestamp("email_verified_at", { mode: "date", withTimezone: true }),
    locale: text("locale").notNull().default("id"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_oauth_idx").on(t.oauthProvider, t.oauthSubject),
  ],
);

export const safeBrowsingCache = pgTable(
  "safe_browsing_cache",
  {
    urlHash: text("url_hash").primaryKey(),
    verdict: text("verdict").notNull(),
    threatTypes: text("threat_types"),
    checkedAt: timestamp("checked_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [index("sbc_expires_idx").on(t.expiresAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan").notNull().default("free"),
    ...timestamps,
  },
  (t) => [uniqueIndex("workspaces_slug_idx").on(t.slug), index("workspaces_owner_idx").on(t.ownerId)],
);

export const domains = pgTable(
  "domains",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    verified: boolean("verified").notNull().default(false),
    sslStatus: text("ssl_status").notNull().default("pending"),
    isDefault: boolean("is_default").notNull().default(false),
    verificationToken: text("verification_token"),
    ...timestamps,
  },
  (t) => [uniqueIndex("domains_hostname_idx").on(t.hostname), index("domains_workspace_idx").on(t.workspaceId)],
);

export const folders = pgTable(
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

export const tags = pgTable(
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

export const links = pgTable(
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
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
    clickLimit: integer("click_limit"),
    iosUrl: text("ios_url"),
    androidUrl: text("android_url"),
    utmParams: jsonb("utm_params").$type<Record<string, string>>(),
    geoRules: jsonb("geo_rules").$type<Array<{ country: string; url: string }>>(),
    abVariants: jsonb("ab_variants").$type<Array<{ url: string; weight: number; label?: string }>>(),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    cloak: boolean("cloak").notNull().default(false),
    clickCount: integer("click_count").notNull().default(0),
    archived: boolean("archived").notNull().default(false),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
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
  ],
);

export const linkTags = pgTable(
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

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    style: jsonb("style").$type<Record<string, unknown>>(),
    logoUrl: text("logo_url"),
    fg: text("fg").notNull().default("#18181B"),
    bg: text("bg").notNull().default("#FFFFFF"),
    shape: text("shape").notNull().default("square"),
    ...timestamps,
  },
  (t) => [index("qr_link_idx").on(t.linkId)],
);

export const clicks = pgTable(
  "clicks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    device: text("device"),
    os: text("os"),
    browser: text("browser"),
    referrer: text("referrer"),
    ipHash: text("ip_hash"),
    isBot: boolean("is_bot").notNull().default(false),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    abVariant: text("ab_variant"),
  },
  (t) => [index("clicks_link_ts_idx").on(t.linkId, t.ts), index("clicks_ts_idx").on(t.ts)],
);

export const apiKeys = pgTable(
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
    lastUsedAt: timestamp("last_used_at", { mode: "date", withTimezone: true }),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("api_keys_hash_idx").on(t.keyHash), index("api_keys_workspace_idx").on(t.workspaceId)],
);

export const abuseReports = pgTable(
  "abuse_reports",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    reporterIpHash: text("reporter_ip_hash"),
    status: text("status").notNull().default("open"),
    ...timestamps,
  },
  (t) => [index("abuse_link_idx").on(t.linkId), index("abuse_status_idx").on(t.status)],
);

export const utmRecipes = pgTable(
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

export const linkyPages = pgTable(
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
    theme: jsonb("theme").$type<Record<string, unknown>>(),
    background: text("background"),
    blocks: jsonb("blocks")
      .$type<Array<{ id: string; kind: string; data: Record<string, unknown> }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    views: integer("views").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("linky_pages_slug_idx").on(t.slug), index("linky_pages_workspace_idx").on(t.workspaceId)],
);

export const linkyPageClicks = pgTable(
  "linky_page_clicks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => linkyPages.id, { onDelete: "cascade" }),
    blockId: text("block_id"),
    ts: timestamp("ts", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    referrer: text("referrer"),
    country: text("country"),
    ipHash: text("ip_hash"),
  },
  (t) => [index("lpc_page_idx").on(t.pageId, t.ts)],
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: jsonb("events").$type<string[]>().notNull().default(sql`'["link.clicked"]'::jsonb`),
    active: boolean("active").notNull().default(true),
    lastDeliveryAt: timestamp("last_delivery_at", { mode: "date", withTimezone: true }),
    lastStatusCode: integer("last_status_code"),
    failureCount: integer("failure_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("webhooks_workspace_idx").on(t.workspaceId)],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    statusCode: integer("status_code"),
    success: boolean("success").notNull().default(false),
    durationMs: integer("duration_ms"),
    error: text("error"),
    requestBody: text("request_body"),
    responseSnippet: text("response_snippet"),
    ts: timestamp("ts", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("whd_webhook_idx").on(t.webhookId, t.ts)],
);

export type PgUser = typeof users.$inferSelect;
export type PgLink = typeof links.$inferSelect;
