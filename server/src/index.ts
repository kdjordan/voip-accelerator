import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { pingRoute } from './routes/ping.js';

const app = new Hono();
app.route('/api/ping', pingRoute);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
