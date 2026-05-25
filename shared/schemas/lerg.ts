import { z } from 'zod';

export const enhancedLergRowSchema = z.object({
  npa: z.string().regex(/^[0-9]{3}$/),
  country_code: z.string().length(2),
  country_name: z.string(),
  state_province_code: z.string().length(2),
  state_province_name: z.string(),
  region: z.string().nullable(),
  category: z.string(),
  source: z.string(),
  confidence_score: z.number(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const lergListResponseSchema = z.object({
  rows: z.array(enhancedLergRowSchema),
  count: z.number().int().nonnegative(),
});

export type EnhancedLergRow = z.infer<typeof enhancedLergRowSchema>;
export type LergListResponse = z.infer<typeof lergListResponseSchema>;

// ---------------------------------------------------------------------------
// Admin write paths (POST /api/lerg/*). Mirror the supabase edge functions
// upload-lerg / add-enhanced-lerg-record / clear-lerg these replace.
// ---------------------------------------------------------------------------

const lergCategorySchema = z.enum(['us-domestic', 'canadian', 'caribbean', 'pacific']);
const lergSourceSchema = z.enum(['lerg', 'manual', 'import', 'seed', 'consolidated']);

// POST /api/lerg/upload — bulk upsert. Server enriches names/category from the
// raw {npa,state,country} triples (matching upload-lerg).
export const lergUploadRequestSchema = z.object({
  records: z
    .array(
      z.object({
        npa: z.string().regex(/^[0-9]{3}$/),
        state: z.string().min(1),
        country: z.string().min(1),
      }),
    )
    .min(1),
});

export const lergUploadResponseSchema = z.object({
  recordsProcessed: z.number().int().nonnegative(),
  recordsInserted: z.number().int().nonnegative(),
  recordsSkipped: z.number().int().nonnegative(),
});

// POST /api/lerg/records — single insert with full geographic context.
export const lergAddRecordRequestSchema = z
  .object({
    npa: z.string().regex(/^[0-9]{3}$/),
    country_code: z.string().regex(/^[A-Z]{2}$/),
    country_name: z.string().min(1),
    state_province_code: z.string().regex(/^[A-Z]{2}$/),
    state_province_name: z.string().min(1),
    region: z.string().nullish(),
    category: lergCategorySchema,
    source: lergSourceSchema.optional(),
    confidence_score: z.number().min(0).max(1).optional(),
    notes: z.string().nullish(),
  })
  .refine(
    (r) =>
      r.country_code === 'US'
        ? r.category === 'us-domestic'
        : r.country_code === 'CA'
          ? r.category === 'canadian'
          : r.category === 'caribbean' || r.category === 'pacific',
    { message: 'category must match country_code', path: ['category'] },
  );

// POST /api/lerg/clear — soft delete (is_active=false) all active rows.
export const lergClearResponseSchema = z.object({
  recordsCleared: z.number().int().nonnegative(),
});

// DELETE /api/lerg/:npa — soft delete (is_active=false) a single active row.
export const lergDeleteResponseSchema = z.object({
  npa: z.string().regex(/^[0-9]{3}$/),
});

export type LergUploadRequest = z.infer<typeof lergUploadRequestSchema>;
export type LergUploadResponse = z.infer<typeof lergUploadResponseSchema>;
export type LergAddRecordRequest = z.infer<typeof lergAddRecordRequestSchema>;
export type LergClearResponse = z.infer<typeof lergClearResponseSchema>;
export type LergDeleteResponse = z.infer<typeof lergDeleteResponseSchema>;
