import { Hono } from 'hono';
import { cors } from "hono/cors";
import { db } from "./database";
import * as schema from "./database/schema";
import { desc } from "drizzle-orm";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }, 200))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .post('/report', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 100) : "";
    if (!reason) return c.json({ error: "reason required" }, 400);
    const details = typeof body.details === "string" ? body.details.slice(0, 1000) : null;
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      null;
    const [row] = await db
      .insert(schema.reports)
      .values({ reason, details, reporterIp: ip })
      .returning();
    return c.json({ ok: true, id: row.id }, 201);
  })
  .get('/reports', async (c) => {
    const rows = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)).limit(100);
    return c.json({ reports: rows }, 200);
  });

export type AppType = typeof app;
export default app;
