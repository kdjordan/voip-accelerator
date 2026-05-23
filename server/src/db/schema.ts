import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  numeric,
  index,
  check,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// better-auth tables
// Shape matches better-auth's Drizzle adapter defaults so the adapter can be
// pointed at this schema in Phase 3 without column renames.
// Ref: https://www.better-auth.com/docs/adapters/drizzle
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// enhanced_lerg — mirrors supabase/migrations/20250628161522_create_enhanced_lerg_table.sql.
// RLS, GRANT, and the get_npa_info() helper are dropped: auth is enforced at
// the Hono handler layer (ADR-0002), and the helper isn't called from the app.
// ---------------------------------------------------------------------------

export const enhancedLerg = pgTable(
  'enhanced_lerg',
  {
    npa: varchar('npa', { length: 3 }).primaryKey(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    countryName: varchar('country_name', { length: 100 }).notNull(),
    stateProvinceCode: varchar('state_province_code', { length: 2 }).notNull(),
    stateProvinceName: varchar('state_province_name', { length: 100 }).notNull(),
    region: varchar('region', { length: 50 }),
    category: varchar('category', { length: 20 }).notNull(),
    source: varchar('source', { length: 20 }).notNull().default('lerg'),
    confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 })
      .notNull()
      .default('1.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    index('idx_enhanced_lerg_country').on(table.countryCode),
    index('idx_enhanced_lerg_state').on(table.stateProvinceCode),
    index('idx_enhanced_lerg_category').on(table.category),
    check('valid_npa', sql`${table.npa} ~ '^[0-9]{3}$'`),
    check('valid_country_code', sql`${table.countryCode} ~ '^[A-Z]{2}$'`),
    check('valid_state_code', sql`${table.stateProvinceCode} ~ '^[A-Z]{2}$'`),
    check(
      'valid_category',
      sql`${table.category} IN ('us-domestic', 'canadian', 'caribbean', 'pacific')`,
    ),
    check(
      'valid_source',
      sql`${table.source} IN ('lerg', 'manual', 'import', 'seed', 'consolidated')`,
    ),
    check(
      'valid_confidence',
      sql`${table.confidenceScore} >= 0 AND ${table.confidenceScore} <= 1`,
    ),
  ],
);

export type EnhancedLergRow = typeof enhancedLerg.$inferSelect;
export type EnhancedLergInsert = typeof enhancedLerg.$inferInsert;
