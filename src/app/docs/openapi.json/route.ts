import { NextResponse } from "next/server";

export const dynamic = "force-static";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.agentbuff.id";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Linky API",
    version: "1.0.0",
    description:
      "REST API untuk membuat, mengelola, dan menganalisa link pendek + Linky Pages. " +
      "Bearer auth dengan API key (`lnk_...`). 120 req/menit per key. CORS terbuka.",
    license: { name: "MIT", url: "https://github.com/nugrahalabib/Linky-Agentbuff/blob/main/LICENSE" },
    contact: { name: "Linky", url: `${APP_URL}/docs/api` },
  },
  servers: [{ url: `${APP_URL}/api/v1`, description: "Production" }],
  security: [{ bearer: [] }],
  components: {
    securitySchemes: {
      bearer: { type: "http", scheme: "bearer", bearerFormat: "lnk_*" },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error", "request_id"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: { code: { type: "string" }, message: { type: "string" } },
          },
          request_id: { type: "string" },
        },
      },
      Link: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          short_url: { type: "string", format: "uri" },
          destination_url: { type: "string", format: "uri" },
          title: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          favicon_url: { type: "string", nullable: true },
          folder_id: { type: "string", nullable: true },
          click_count: { type: "integer" },
          archived: { type: "boolean" },
          cloak: { type: "boolean" },
          has_password: { type: "boolean" },
          expires_at: { type: "string", format: "date-time", nullable: true },
          click_limit: { type: "integer", nullable: true },
          ios_url: { type: "string", nullable: true },
          android_url: { type: "string", nullable: true },
          utm_params: { type: "object", additionalProperties: { type: "string" }, nullable: true },
          og: {
            type: "object",
            properties: {
              title: { type: "string", nullable: true },
              description: { type: "string", nullable: true },
              image: { type: "string", nullable: true },
            },
          },
          created_by: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time", nullable: true },
          updated_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      CreateLinkInput: {
        type: "object",
        required: ["destinationUrl"],
        properties: {
          destinationUrl: { type: "string", format: "uri" },
          customSlug: { type: "string", minLength: 2, maxLength: 50 },
          title: { type: "string" },
          description: { type: "string" },
          folderId: { type: "string" },
          tagIds: { type: "array", items: { type: "string" } },
          password: { type: "string" },
          expiresAt: { type: "string", format: "date-time" },
          clickLimit: { type: "integer", minimum: 1 },
          iosUrl: { type: "string", format: "uri" },
          androidUrl: { type: "string", format: "uri" },
          utmSource: { type: "string" },
          utmMedium: { type: "string" },
          utmCampaign: { type: "string" },
          utmTerm: { type: "string" },
          utmContent: { type: "string" },
          ogTitle: { type: "string" },
          ogDescription: { type: "string" },
          ogImage: { type: "string", format: "uri" },
          cloak: { type: "boolean" },
        },
      },
      UpdateLinkInput: {
        type: "object",
        properties: {
          destinationUrl: { type: "string", format: "uri" },
          title: { type: "string" },
          description: { type: "string" },
          archived: { type: "boolean" },
          folderId: { type: "string", nullable: true },
          password: { type: "string" },
          clearPassword: { type: "boolean" },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          clickLimit: { type: "integer" },
          iosUrl: { type: "string" },
          androidUrl: { type: "string" },
          utmSource: { type: "string" },
          utmMedium: { type: "string" },
          utmCampaign: { type: "string" },
          ogTitle: { type: "string" },
          ogDescription: { type: "string" },
          ogImage: { type: "string" },
          cloak: { type: "boolean" },
        },
      },
      AnalyticsOverview: {
        type: "object",
        properties: {
          period_days: { type: "integer" },
          totalClicks: { type: "integer" },
          uniqueVisitors: { type: "integer" },
          avgPerDay: { type: "integer" },
          totalLinks: { type: "integer" },
          last7Days: {
            type: "array",
            items: {
              type: "object",
              properties: { date: { type: "string" }, clicks: { type: "integer" } },
            },
          },
          topCountries: {
            type: "array",
            items: {
              type: "object",
              properties: { country: { type: "string" }, clicks: { type: "integer" } },
            },
          },
          topReferrers: {
            type: "array",
            items: {
              type: "object",
              properties: { referrer: { type: "string" }, clicks: { type: "integer" } },
            },
          },
          topDevices: {
            type: "array",
            items: {
              type: "object",
              properties: { device: { type: "string" }, clicks: { type: "integer" } },
            },
          },
          topBrowsers: {
            type: "array",
            items: {
              type: "object",
              properties: { browser: { type: "string" }, clicks: { type: "integer" } },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Bearer token kosong/expired/revoked.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource tidak ada di workspace ini.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      RateLimited: {
        description: "120 req/menit terlewati.",
        headers: {
          "X-RateLimit-Limit": { schema: { type: "integer" } },
          "X-RateLimit-Remaining": { schema: { type: "integer" } },
          "X-RateLimit-Reset": { schema: { type: "integer" } },
        },
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  paths: {
    "/links": {
      get: {
        summary: "List links",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          { name: "archived", in: "query", schema: { type: "string", enum: ["0", "1"] } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Link" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
      post: {
        summary: "Create link",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateLinkInput" } } },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Link" } } },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": { description: "Slug taken", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "422": { description: "Unsafe URL", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/links/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: {
        summary: "Get link",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Link" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update link",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateLinkInput" } } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Link" } } } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Delete link",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/analytics/workspace": {
      get: {
        summary: "Workspace analytics overview",
        parameters: [{ name: "days", in: "query", schema: { type: "integer", minimum: 1, maximum: 365, default: 30 } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/AnalyticsOverview" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/analytics/links/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: {
        summary: "Per-link analytics",
        parameters: [{ name: "days", in: "query", schema: { type: "integer", minimum: 1, maximum: 365, default: 30 } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/AnalyticsOverview" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/qr": {
      get: {
        summary: "Generate QR code",
        parameters: [
          { name: "text", in: "query", required: true, schema: { type: "string" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["svg", "png"], default: "svg" } },
          { name: "size", in: "query", schema: { type: "integer", minimum: 64, maximum: 2048 } },
          { name: "fg", in: "query", schema: { type: "string" } },
          { name: "bg", in: "query", schema: { type: "string" } },
          { name: "margin", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Image bytes",
            content: { "image/svg+xml": {}, "image/png": {} },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/me": {
      get: {
        summary: "Identify the current API key + workspace",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        workspace: {
                          type: "object",
                          properties: { id: { type: "string" }, name: { type: "string" }, slug: { type: "string" } },
                        },
                        api_key: {
                          type: "object",
                          properties: { id: { type: "string" }, name: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
