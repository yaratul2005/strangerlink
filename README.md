# StrangerLink

> Anonymous one-on-one video & text chat with random strangers — an Omegle-style experience, rebuilt for the modern web.

StrangerLink pairs you instantly with a random person for a private video or text conversation. No accounts, no history. Skip to the next person anytime.

---

## Features

- **Instant matchmaking** — in-memory queue pairs two waiting users in real time.
- **WebRTC video & audio** — peer-to-peer media, no server in the middle once connected.
- **Live text chat** — with typing indicators and message history per session.
- **Skip / Next** — leave a chat and re-queue with one click.
- **Reporting** — flag bad actors; reports persisted to the database.
- **Age gate** — 18+ confirmation before entering.
- **Polished UI** — black / electric-blue / white theme, Inter typography, framer-motion animations, particle background.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Frontend | React + Vite + Wouter (routing) + Tailwind CSS v4 + framer-motion |
| API | [Hono](https://hono.dev) |
| Realtime signaling | Standalone Bun WebSocket server |
| Media | WebRTC (peer-to-peer) |
| Database | Turso (libSQL) + Drizzle ORM |
| Process mgmt | PM2 (production) |
| Monorepo | Turborepo + Bun workspaces |

---

## Architecture

```
┌──────────────┐      WebSocket (signaling)      ┌──────────────────┐
│   Browser A  │ ◄─────────────────────────────► │  Signal Server   │
│  (React UI)  │                                  │  (Bun, :4201)    │
└──────┬───────┘                                  │  - matchmaking   │
       │                                          │  - SDP/ICE relay │
       │  WebRTC (P2P media + data)               └──────────────────┘
       │ ◄──────────────────────────────────────►
┌──────┴───────┐                                  ┌──────────────────┐
│   Browser B  │ ──── HTTP (REST: reports) ─────► │   API (Hono)     │
└──────────────┘                                  │   + Turso DB     │
                                                  └──────────────────┘
```

- **Matchmaking** runs in-memory on the signal server: incoming users join a queue and are paired FIFO.
- **Signaling** (offer/answer/ICE candidates) is relayed over WebSocket; actual audio/video flows peer-to-peer via WebRTC.
- **Reports** are sent over HTTP to the Hono API and stored in Turso.

---

## Project Structure

```
strangerlink/
├── packages/
│   └── web/
│       └── src/
│           ├── api/              # Hono API + Drizzle database (schema, client)
│           ├── server.ts         # API/web entry
│           ├── signal/
│           │   └── server.ts     # Standalone WebSocket signaling + matchmaking
│           └── web/              # React frontend
│               ├── components/   # UI, chat, modals
│               ├── context/      # ChatContext (global chat state)
│               ├── hooks/        # useSignal, useWebRTC, useMediaStream
│               ├── lib/          # signal URL resolver, api client, utils
│               └── pages/        # Home, Chat, NotFound
├── scripts/
│   └── dev.ts                    # Boots web + signal servers together
└── ecosystem.config.cjs          # PM2 config (web + signal apps)
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) `1.3.14+`
- A [Turso](https://turso.tech) database (URL + auth token)

### Install

```bash
bun install
```

### Environment

Create `.env` in the project root (or `packages/web/.env`):

```bash
# Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Optional — frontend signal server override (defaults derive from window.location + :4201)
VITE_SIGNAL_URL=ws://localhost:4201/signal
# or
VITE_SIGNAL_PORT=4201
```

### Database

```bash
bun run db:push      # push schema to Turso
```

### Run (development)

Boot **both** the web frontend and signal server with one command:

```bash
bun run dev:all
```

- Web → http://localhost:4200
- Signal → ws://localhost:4201/signal (health: `curl http://localhost:4201/signal/health`)

Or run them separately:

```bash
bun run dev                              # web only (:4200)
bun packages/web/src/signal/server.ts    # signal only (:4201)
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev:all` | Start web + signal servers together (recommended for dev) |
| `bun run dev` | Start the web frontend only |
| `bun run build` | Build all packages (Turbo) |
| `bun run start` | Start in production via PM2 |
| `bun run db:push` | Push Drizzle schema to Turso |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run typecheck` | Type-check all packages |
| `bun run lint` | Lint (oxlint + release validation) |

---

## Production

The app runs under PM2 with two processes — the web/API server and the standalone signal server:

```bash
bun run build
bun run start    # pm2 start ecosystem.config.cjs
```

### ⚠️ Production checklist

See [`PRODUCTION_AUDIT.md`](./PRODUCTION_AUDIT.md) for the full readiness review. Before a public launch:

**1. TURN server (required for reliable video).** Without TURN, ~10–20% of users behind strict NATs/firewalls cannot establish a video connection. Provision coturn or a provider (Twilio / Cloudflare / Metered) and set:

```bash
VITE_TURN_URL=turn:turn.yourdomain.com:3478
VITE_TURN_USERNAME=...
VITE_TURN_CREDENTIAL=...
```

**2. TLS + same-origin WebSocket.** Camera/mic (`getUserMedia`) require HTTPS. Serve the app over TLS and reverse-proxy the signal server under the **same origin** at `/signal` — the frontend auto-resolves to `wss://<host>/signal` in production. Example (Caddy):

```caddyfile
strangerlink.app {
    reverse_proxy /signal*  localhost:4201
    reverse_proxy /api/*     localhost:4200
    reverse_proxy /*         localhost:4200
}
```

(Or set `VITE_SIGNAL_URL` explicitly if the signal server lives elsewhere.)

**3. Lock down origins & moderation.** Set these in prod (see [`.env.example`](./.env.example)):

| Var | Purpose |
|-----|---------|
| `ALLOWED_ORIGINS` | CORS allowlist for the REST API |
| `SIGNAL_ALLOWED_ORIGINS` | WebSocket origin allowlist (rejects cross-site sockets) |
| `ADMIN_TOKEN` | Bearer token for `GET /api/reports`; endpoint is **404 / disabled** if unset |

Built-in abuse protection: per-IP connection cap (`SIGNAL_MAX_CONNS_PER_IP`), global peer ceiling (`SIGNAL_MAX_PEERS`), per-peer message rate limiting, and `POST /api/report` rate limiting (5/min/IP).

**4. Still open** (documented in the audit): horizontal scaling needs Redis-backed shared state (currently single-process, in-memory), real age verification, content moderation, legal docs (ToS / privacy policy), and observability.

---

## License

[MIT](./LICENSE) © 2026 Yasser Ahmed
