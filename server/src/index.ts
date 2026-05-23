import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { pingRoute } from './routes/ping.js';
import { auth } from './auth.js';

const app = new Hono();
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
app.route('/api/ping', pingRoute);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
