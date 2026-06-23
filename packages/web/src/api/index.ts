import { Hono } from 'hono';
import { cors } from "hono/cors";
import { db } from "./database";
import * as schema from "./database/schema";
import { desc } from "drizzle-orm";

// --- CORS: allowlist in prod, permissive in dev ------------------------------
// Comma-separated origins via ALLOWED_ORIGINS. Empty => reflect any (dev only).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function resolveOrigin(origin: string | undefined): string | null {
  if (ALLOWED_ORIGINS.length === 0) return origin ?? "*"; // dev: reflect
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return null; // blocked
}

// --- Simple in-memory rate limiter (per IP) ----------------------------------
const REPORT_LIMIT = 5; // reports
const REPORT_WINDOW_MS = 60_000; // per minute
const reportHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (reportHits.get(ip) ?? []).filter((t) => now - t < REPORT_WINDOW_MS);
  hits.push(now);
  reportHits.set(ip, hits);
  return hits.length > REPORT_LIMIT;
}

function clientIp(c: { req: { header: (k: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

// Admin token for moderation endpoints. If unset, the endpoint is disabled.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => resolveOrigin(origin), credentials: true, exposeHeaders: ["set-auth-token"] }))
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }, 200))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .post('/report', async (c) => {
    const ip = clientIp(c);
    if (rateLimited(ip)) return c.json({ error: "rate limited" }, 429);
    const body = await c.req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 100) : "";
    if (!reason) return c.json({ error: "reason required" }, 400);
    const details = typeof body.details === "string" ? body.details.slice(0, 1000) : null;
    const [row] = await db
      .insert(schema.reports)
      .values({ reason, details, reporterIp: ip === "unknown" ? null : ip })
      .returning();
    return c.json({ ok: true, id: row.id }, 201);
  })
  // Moderation endpoint — protected by ADMIN_TOKEN bearer.
  // Disabled entirely (404) when ADMIN_TOKEN is not configured.
  .get('/reports', async (c) => {
    if (!ADMIN_TOKEN) return c.json({ error: "not found" }, 404);
    const auth = c.req.header("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== ADMIN_TOKEN) return c.json({ error: "unauthorized" }, 401);
    const rows = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)).limit(100);
    return c.json({ reports: rows }, 200);
  });

export type AppType = typeof app;
export default app;
