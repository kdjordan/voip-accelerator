import { Hono } from 'hono';
import { sql as drizzleSql } from 'drizzle-orm';
import { pingResponseSchema, type PingResponse } from '@voip-accelerator/shared';
import { db } from '../db/client.js';

export const pingRoute = new Hono().get('/', async (c) => {
  let lergCount = 0;
  let hasLergTable = false;
  let status: PingResponse['status'] = 'ok';

  try {
    const [row] = await db.execute<{ count: string }>(
      drizzleSql`SELECT COUNT(*)::text AS count FROM enhanced_lerg`,
    );
    lergCount = Number(row?.count ?? 0);
    hasLergTable = lergCount > 0;
  } catch (err) {
    console.error('ping: enhanced_lerg query failed', err);
    status = 'error';
  }

  const body = pingResponseSchema.parse({
    status,
    hasLergTable,
    lergCount,
    timestamp: new Date().toISOString(),
  });
  return c.json(body, status === 'ok' ? 200 : 500);
});
