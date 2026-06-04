import { z } from "zod";

// Zod's `.url()` accepts ANY valid URL incl. `javascript:`/`data:`/`vbscript:`. For fields that end
// up as a redirect target or an href/src, restrict to http(s) so they can never carry script.
export const httpUrl = () =>
  z.string().refine(
    (v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL harus diawali http:// atau https://" },
  );

// Login is Google OAuth-only — no signup/login/change-password schemas (see src/lib/oauth.ts).

export const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  locale: z.enum(["id", "en"]).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").max(80).optional(),
  slug: z
    .string()
    .min(3, "Min 3 karakter")
    .max(40, "Max 40 karakter")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Hanya huruf kecil, angka, dan tanda minus.")
    .optional(),
});

export const deleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
});

export const shortenAnonSchema = z.object({
  destinationUrl: z.string().min(1).max(2000),
  customSlug: z.string().max(50).optional(),
});
export type ShortenAnonInput = z.infer<typeof shortenAnonSchema>;

export const createLinkSchema = z.object({
  destinationUrl: z.string().min(1).max(2000),
  customSlug: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  password: z.string().min(4).max(100).optional().or(z.literal("")),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
  clickLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  iosUrl: httpUrl().optional().or(z.literal("")),
  androidUrl: httpUrl().optional().or(z.literal("")),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: httpUrl().optional().or(z.literal("")),
  cloak: z.boolean().optional(),
  folderId: z.string().max(20).optional().nullable(),
  domainId: z.string().max(20).optional().nullable(),
  tagIds: z.array(z.string().max(20)).max(50).optional(),
});
export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export const updateLinkSchema = createLinkSchema.partial().extend({
  archived: z.boolean().optional(),
  clearPassword: z.boolean().optional(),
});
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;

export const qrConfigSchema = z.object({
  fg: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#18181B"),
  bg: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#FFFFFF"),
  size: z.coerce.number().int().min(128).max(2048).default(512),
  margin: z.coerce.number().int().min(0).max(8).default(2),
});
export type QrConfig = z.infer<typeof qrConfigSchema>;
