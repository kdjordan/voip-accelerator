import type { MiddlewareHandler } from 'hono';
import { auth } from '../auth.js';

// Gate write routes on an admin session. GET /api/lerg is intentionally
// unauthenticated (read path, ADR-0002); every mutation must pass through here.
// 3b reuses this for the admin user-management routes.
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (session.user.role !== 'admin') {
    return c.json({ error: 'Admin role required' }, 403);
  }

  return next();
};
