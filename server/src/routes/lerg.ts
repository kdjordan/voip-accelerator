import { Hono } from 'hono';
import { and, asc, eq, sql } from 'drizzle-orm';
import {
  enhancedLergRowSchema,
  lergListResponseSchema,
  lergUploadRequestSchema,
  lergUploadResponseSchema,
  lergAddRecordRequestSchema,
  lergClearResponseSchema,
  lergDeleteResponseSchema,
} from '@voip-accelerator/shared';
import { db } from '../db/client.js';
import { enhancedLerg, type EnhancedLergInsert } from '../db/schema.js';
import { requireAdmin } from '../middleware/require-admin.js';

type EnhancedLergSelect = typeof enhancedLerg.$inferSelect;

function toRowResponse(r: EnhancedLergSelect) {
  return {
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
  };
}

export const lergRoute = new Hono()
  .get('/', async (c) => {
    const rows = await db
      .select()
      .from(enhancedLerg)
      .where(eq(enhancedLerg.isActive, true))
      .orderBy(asc(enhancedLerg.npa));

    const body = lergListResponseSchema.parse({
      rows: rows.map(toRowResponse),
      count: rows.length,
    });
    return c.json(body);
  })
  // Bulk upsert from raw {npa,state,country} triples; server enriches the rest.
  .post('/upload', requireAdmin, async (c) => {
    const parsed = lergUploadRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid upload payload' }, 400);
    }
    const { records } = parsed.data;

    // Dedupe by NPA (last write wins, matching upload-lerg's pre-filter).
    const byNpa = new Map<string, EnhancedLergInsert>();
    for (const r of records) {
      const country = r.country.trim().toUpperCase();
      const state = r.state.trim().toUpperCase();
      byNpa.set(r.npa.trim(), {
        npa: r.npa.trim(),
        countryCode: country,
        countryName: countryName(country),
        stateProvinceCode: state,
        stateProvinceName: stateName(state, country),
        region: stateRegion(country),
        category: categorize(country),
        source: 'import',
        confidenceScore: '0.95',
        isActive: true,
        notes: `Uploaded from LERG file on ${new Date().toISOString()}`,
      });
    }
    const values = [...byNpa.values()];

    let inserted = 0;
    const BATCH = 500;
    for (let i = 0; i < values.length; i += BATCH) {
      const rows = await db
        .insert(enhancedLerg)
        .values(values.slice(i, i + BATCH))
        .onConflictDoUpdate({
          target: enhancedLerg.npa,
          set: {
            countryCode: sql`excluded.country_code`,
            countryName: sql`excluded.country_name`,
            stateProvinceCode: sql`excluded.state_province_code`,
            stateProvinceName: sql`excluded.state_province_name`,
            region: sql`excluded.region`,
            category: sql`excluded.category`,
            source: sql`excluded.source`,
            confidenceScore: sql`excluded.confidence_score`,
            isActive: sql`excluded.is_active`,
            notes: sql`excluded.notes`,
            updatedAt: sql`now()`,
          },
        })
        .returning({ npa: enhancedLerg.npa });
      inserted += rows.length;
    }

    const body = lergUploadResponseSchema.parse({
      recordsProcessed: records.length,
      recordsInserted: inserted,
      recordsSkipped: records.length - values.length,
    });
    return c.json(body);
  })
  // Single insert with full geographic context; 409 on duplicate NPA.
  .post('/records', requireAdmin, async (c) => {
    const parsed = lergAddRecordRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }
    const p = parsed.data;

    try {
      const [row] = await db
        .insert(enhancedLerg)
        .values({
          npa: p.npa,
          countryCode: p.country_code.toUpperCase(),
          countryName: p.country_name.trim(),
          stateProvinceCode: p.state_province_code.toUpperCase(),
          stateProvinceName: p.state_province_name.trim(),
          region: p.region?.trim() || null,
          category: p.category,
          source: p.source ?? 'manual',
          confidenceScore: (p.confidence_score ?? 1).toFixed(2),
          notes: p.notes?.trim() || null,
          isActive: true,
        })
        .returning();

      return c.json(enhancedLergRowSchema.parse(toRowResponse(row)), 201);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
        return c.json({ error: `NPA '${p.npa}' already exists.` }, 409);
      }
      console.error('lerg: add record failed', err);
      return c.json({ error: 'Failed to add LERG record' }, 500);
    }
  })
  // Soft delete: flip every active row to is_active=false (matching clear-lerg).
  .post('/clear', requireAdmin, async (c) => {
    const rows = await db
      .update(enhancedLerg)
      .set({ isActive: false, notes: 'Cleared via admin interface', updatedAt: new Date() })
      .where(eq(enhancedLerg.isActive, true))
      .returning({ npa: enhancedLerg.npa });

    const body = lergClearResponseSchema.parse({ recordsCleared: rows.length });
    return c.json(body);
  })
  // Soft delete a single NPA: flip its active row to is_active=false.
  .delete('/:npa', requireAdmin, async (c) => {
    const npa = c.req.param('npa');
    if (!/^[0-9]{3}$/.test(npa)) {
      return c.json({ error: 'NPA must be exactly 3 digits' }, 400);
    }

    const rows = await db
      .update(enhancedLerg)
      .set({ isActive: false, notes: 'Deleted via admin interface', updatedAt: new Date() })
      .where(and(eq(enhancedLerg.npa, npa), eq(enhancedLerg.isActive, true)))
      .returning({ npa: enhancedLerg.npa });

    if (rows.length === 0) {
      return c.json({ error: `NPA '${npa}' not found` }, 404);
    }

    const body = lergDeleteResponseSchema.parse({ npa: rows[0].npa });
    return c.json(body);
  });

// ---------------------------------------------------------------------------
// Enrichment maps for the upload path — ported from the upload-lerg edge fn.
// ---------------------------------------------------------------------------

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  BS: 'Bahamas',
  BB: 'Barbados',
  JM: 'Jamaica',
  TT: 'Trinidad and Tobago',
  GU: 'Guam',
  AS: 'American Samoa',
  MP: 'Northern Mariana Islands',
  VI: 'Virgin Islands',
  PR: 'Puerto Rico',
  DO: 'Dominican Republic',
  KN: 'Saint Kitts and Nevis',
  LC: 'Saint Lucia',
  VC: 'Saint Vincent and the Grenadines',
  GD: 'Grenada',
  AG: 'Antigua and Barbuda',
  DM: 'Dominica',
  KY: 'Cayman Islands',
  BM: 'Bermuda',
  TC: 'Turks and Caicos Islands',
  VG: 'British Virgin Islands',
  AI: 'Anguilla',
  MS: 'Montserrat',
  SX: 'Sint Maarten',
};

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

const CA_PROVINCES: Record<string, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

function stateName(stateCode: string, countryCode: string): string {
  if (countryCode === 'US') return US_STATES[stateCode] ?? stateCode;
  if (countryCode === 'CA') return CA_PROVINCES[stateCode] ?? stateCode;
  return stateCode;
}

function stateRegion(countryCode: string): string {
  if (countryCode === 'US') return 'US';
  if (countryCode === 'CA') return 'CA';
  return countryCode;
}

function categorize(countryCode: string): EnhancedLergInsert['category'] {
  if (['GU', 'AS', 'MP'].includes(countryCode)) return 'pacific';
  if (countryCode === 'US') return 'us-domestic';
  if (countryCode === 'CA') return 'canadian';
  return 'caribbean';
}
