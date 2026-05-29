import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { pingRoute } from "./routes/ping.js";
import { lergRoute } from "./routes/lerg.js";
import { auth } from "./auth.js";

const app = new Hono();

// Canonicalize the host in production: 301 the bare apex → www so there's a
// single indexable host (canonical/OG/sitemap all use www). Cloudflare DNS is
// grey-cloud (not proxied), so this can't be done at the edge — the origin
// server is the only place in the request path. /api/* is excluded so API and
// auth requests are never 301-redirected.
if (process.env.NODE_ENV === "production") {
  app.use("*", async (c, next) => {
    if (c.req.header("host") === "voipaccelerator.com" && !c.req.path.startsWith("/api/")) {
      const { pathname, search } = new URL(c.req.url);
      return c.redirect(`https://www.voipaccelerator.com${pathname}${search}`, 301);
    }
    return next();
  });
}

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api/ping", pingRoute);
app.route("/api/lerg", lergRoute);

// Production: serve the built Vue SPA from the same origin as the API (combined
// single app — ADR-0007). Dev serves the client via Vite (:5173) proxying /api,
// so static serving is prod-only and never shadows the dev flow. Mounted AFTER
// the /api routes, which are terminal, so they always win.
if (process.env.NODE_ENV === "production") {
  const root = process.env.CLIENT_DIST ?? "./client/dist";
  app.use("/*", serveStatic({ root }));
  // SPA history-mode fallback: any unmatched non-API GET returns index.html so
  // client-side routes (e.g. /admin) resolve. SSG marketing routes generated as
  // /features.html are served first so crawlers receive route-specific HTML.
  // Unknown /api/* paths stay 404s.
  app.get("*", ((c, next) => {
    if (c.req.path.startsWith("/api/")) return c.notFound();
    const routeName = c.req.path.replace(/^\/+|\/+$/g, "");
    if (routeName && !routeName.includes("..")) {
      const routeHtml = `${routeName}.html`;
      if (existsSync(path.join(root, routeHtml))) {
        return serveStatic({ root, path: routeHtml })(c, next);
      }
    }
    return serveStatic({ root, path: "spa.html" })(c, next);
  }) as any);
}

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
