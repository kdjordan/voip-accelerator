import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { pingRoute } from './routes/ping.js';
import { lergRoute } from './routes/lerg.js';
import { auth } from './auth.js';

const app = new Hono();
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
app.route('/api/ping', pingRoute);
app.route('/api/lerg', lergRoute);

// Production: serve the built Vue SPA from the same origin as the API (combined
// single app — ADR-0007). Dev serves the client via Vite (:5173) proxying /api,
// so static serving is prod-only and never shadows the dev flow. Mounted AFTER
// the /api routes, which are terminal, so they always win.
if (process.env.NODE_ENV === 'production') {
  const root = process.env.CLIENT_DIST ?? './client/dist';
  app.use('/*', serveStatic({ root }));
  // SPA history-mode fallback: any unmatched non-API GET returns index.html so
  // client-side routes (e.g. /admin) resolve. Unknown /api/* paths stay 404s.
  app.get('*', (c, next) => {
    if (c.req.path.startsWith('/api/')) return c.notFound();
    return serveStatic({ root, path: 'index.html' })(c, next);
  });
}

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
