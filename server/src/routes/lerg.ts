import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { lergListResponseSchema } from '@voip-accelerator/shared';
import { db } from '../db/client.js';
import { enhancedLerg } from '../db/schema.js';

export const lergRoute = new Hono().get('/', async (c) => {
  const rows = await db
    .select()
    .from(enhancedLerg)
    .where(eq(enhancedLerg.isActive, true))
    .orderBy(asc(enhancedLerg.npa));

  const body = lergListResponseSchema.parse({
    rows: rows.map((r) => ({
      npa: r.npa,
      country_code: r.countryCode,
      country_name: r.countryName,
      state_province_code: r.stateProvinceCode,
      state_province_name: r.stateProvinceName,
      region: r.region,
      category: r.category,
      source: r.source,
      confidence_score: Number(r.confidenceScore),
      notes: r.notes,
      is_active: r.isActive,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    })),
    count: rows.length,
  });

  return c.json(body);
});
