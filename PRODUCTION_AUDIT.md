# StrangerLink — Production Readiness Audit

**Date:** 2026-06-23
**Verdict:** ⚠️ **Not production-ready.** Works as a demo/MVP. Several blockers for real-world public traffic.

---

## TL;DR

| Area | Status |
|------|--------|
| Core flows (match, video, text, skip, report) | ✅ Working |
| Single-server scaling | 🔴 Hard ceiling (~hundreds of users, one process) |
| NAT traversal (real-world video connect rate) | 🔴 No TURN — video fails for ~10–20% of users |
| Prod WS routing (`wss://` behind one domain) | 🔴 Broken by default (hardcoded `:4201`) |
| Moderation / safety | 🔴 Effectively none |
| Abuse / DoS protection | 🟠 Minimal |
| Observability (logs, metrics, errors) | 🔴 None |
| Legal (privacy, ToS, age verification) | 🔴 Missing — high risk for this app category |
| Data persistence (reports) | 🟠 Stores IP without consent/retention policy |

---

## 🔴 Blockers (must fix before public launch)

### 1. No TURN server — video will fail for many users
`useWebRTC.ts` only ships Google STUN. STUN can't traverse symmetric NATs / strict corporate/mobile firewalls. In the real world that's **10–20% of connections silently failing** to establish video.
- TURN support exists via `VITE_TURN_URL` env but is unset.
- **Fix:** Provision a TURN server (coturn self-hosted, or Twilio/Cloudflare/Metered TURN) and set the env vars.

### 2. Production WebSocket URL is broken by default
`signal.ts` falls back to `wss://<host>:4201/signal`. In prod you almost never expose port 4201 publicly — you reverse-proxy WS under the main domain (e.g. `wss://app.com/signal`). The signal server and web server are **two separate Bun processes on two ports**; nothing proxies `/signal` from the web server to the signal server.
- **Fix:** Add a reverse proxy (Caddy/Nginx) routing `/signal` → signal process, and set `VITE_SIGNAL_URL=wss://yourdomain/signal` at build time. Or merge signaling into the main server behind one port.

### 3. Single-process, in-memory matchmaking = no horizontal scaling
`peers`, `queue`, `rooms` are in-process Maps. You cannot run 2+ signal instances — users on different instances can't match, and PM2 restart drops everyone mid-call.
- Acceptable for a demo. **Not** for sustained public traffic.
- **Fix (when needed):** Shared state via Redis (pub/sub + queue) so instances coordinate, or accept a documented single-instance ceiling.

### 4. No real moderation / safety layer
This app category (anonymous strangers + video) attracts abuse, nudity, minors, harassment. Current state:
- Reports are stored but **never surfaced or acted on** — no admin/mod view, no auto-ban.
- No image/content moderation, no rate of bans, no blocklist.
- Age gate is a **client-side checkbox** — trivially bypassed, not real verification.
- **Fix:** At minimum an admin dashboard for reports + a ban list (by a stable client token/fingerprint, not just IP). Consider an ML NSFW check on video frames for serious launch.

### 5. Legal & compliance gaps
For an Omegle-style product these are not optional:
- No Privacy Policy, no Terms of Service.
- Collecting and storing `reporter_ip` with **no consent banner, no retention/deletion policy** → GDPR/CCPA exposure.
- No documented minimum-age enforcement (Omegle was shut down partly over child-safety lawsuits).
- **Fix:** Add ToS + Privacy Policy, a consent/cookie notice, IP retention policy (or stop storing IPs), and a clear abuse-reporting + takedown path.

---

## 🟠 Important (fix soon)

### 6. Abuse / DoS surface on the signal server
- WS upgrade accepts **any origin** — no origin allowlist. Anyone can connect from anywhere.
- No connection rate-limiting per IP — trivial to open thousands of sockets and exhaust memory (every socket = a `Peer` object, queue entry).
- `submit_report` over WS just `console.log`s — no rate limit, spammable.
- Message relay has length cap (500) and HTML strip ✅, but no per-peer message rate limit (chat flood possible).
- **Fix:** Origin check on upgrade, per-IP connection + message rate limits, max-peers cap.

### 7. `/report` REST endpoint is unauthenticated & unthrottled
`api/index.ts` `POST /report` and `GET /reports` are open. `GET /reports` **leaks all reports including IPs to anyone**.
- **Fix:** Protect `GET /reports` behind admin auth. Rate-limit `POST /report`.

### 8. No observability
- No structured logging, no error tracking (Sentry), no metrics (active users, match latency, connect success rate, TURN usage).
- Errors in WebRTC negotiation are swallowed (`.catch(() => {})`).
- **Fix:** Add error tracking + basic metrics. You're flying blind on connect-failure rate otherwise — which directly hides issue #1.

### 9. Reconnect logic loses session state
`useSignal.ts` auto-reconnects every 1.5s, but on reconnect the server assigns a **new peer id** (`open` always creates a fresh `Peer`). Mid-call network blip → both sides silently orphaned, no rejoin. Also no exponential backoff (1.5s fixed → reconnect storm if signal server is down).
- **Fix:** Exponential backoff + jitter; optionally session-resume token.

### 10. CI doesn't actually gate anything meaningful
- `lint` step is `continue-on-error: true` → lint failures are ignored.
- No tests exist, so CI only proves it compiles + builds. No flow/integration tests for matchmaking or signaling.
- **Fix:** Make lint blocking once clean; add at least signaling unit tests + a headless WebRTC match smoke test.

---

## 🟡 Minor / hardening

- **Health checks:** signal has `/signal/health` ✅; PM2 `autorestart` ✅. But no liveness wired to a load balancer / uptime monitor.
- **Graceful shutdown:** signal server doesn't notify peers on `SIGTERM` before exit — PM2 restart drops calls without a "server restarting" message.
- **CORS:** API reflects any origin (`origin ?? "*"` with `credentials: true`) — overly permissive; tighten to known origins.
- **Static file serving** (`server.ts`) does `..` stripping ✅ but `replaceAll("..","")` is naive (e.g. `....//` could slip) — use `path.normalize` + prefix check.
- **No HTTPS/WSS enforcement** in code — `getUserMedia` (camera/mic) **requires** a secure context; the app won't work over plain HTTP except on localhost. Must deploy behind TLS.
- **Interest matching** picks "best" candidate but iterates whole queue every join (O(n) per match) — fine at small scale, watch at large.
- **`.env.template`** still references `BETTER_AUTH_SECRET` and auth scaffolding the app doesn't use — confusing, clean it up.
- **No load/soak testing** done — unknown behavior at 100s of concurrent sockets.

---

## What IS solid ✅

- Clean WebRTC offer/answer/ICE flow with proper pending-ICE buffering before remote description.
- Skip cooldown / rate limiting on skips (anti-spam) is implemented.
- Message sanitization (HTML strip + length cap).
- Interest-based matching with FIFO fallback window.
- Proper peer/room cleanup on disconnect.
- Reasonable component/hook architecture; build is clean.

---

## Recommended path to production (priority order)

1. **TURN server** (#1) — biggest impact on actual usability.
2. **Prod WSS routing via reverse proxy + TLS** (#2, secure-context requirement).
3. **Legal docs + age/abuse handling** (#5, #4) — category-specific liability.
4. **Origin allowlist + rate limits + protect `/reports`** (#6, #7).
5. **Observability** (#8) so you can see #1's real failure rate.
6. **Redis-backed state** (#3) only once you outgrow one instance.
7. Reconnect backoff (#9), CI tightening + tests (#10), hardening list.
