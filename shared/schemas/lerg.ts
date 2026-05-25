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
