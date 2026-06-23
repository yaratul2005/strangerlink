/**
 * StrangerLink — Standalone Bun WebSocket signaling server.
 *
 * Responsibilities:
 *  - Matchmaking queue (interest-based with FIFO fallback)
 *  - WebRTC signaling relay (offer / answer / ICE)
 *  - Text chat relay + typing indicators
 *  - Skip / stop lifecycle, re-queue on skip
 *
 * In-memory only (no Redis/Mongo). Single-process. Horizontally non-scalable
 * by design for this build, but the protocol mirrors the spec exactly.
 *
 * Runs on its own port (default 4201) alongside the Vite/web server.
 */

type Mode = "video" | "text";

interface Peer {
  id: string;
  ws: import("bun").ServerWebSocket<WsData>;
  ip: string;
  mode: Mode;
  interests: string[];
  language: string;
  roomId: string | null;
  joinedAt: number;
  queuedAt: number;
  skipTimestamps: number[];
  msgTimestamps: number[];
}

interface WsData {
  id: string;
  ip: string;
}

const peers = new Map<string, Peer>();
const queue: string[] = []; // peer ids waiting
const rooms = new Map<string, { a: string; b: string }>();

const INTEREST_MATCH_WINDOW_MS = 5000; // prefer interest match for 5s, then FIFO
const MAX_MESSAGE_LEN = 500;
const MAX_INTERESTS = 10;
const SKIP_LIMIT = 10; // per window
const SKIP_WINDOW_MS = 60_000;
const SKIP_COOLDOWN_MS = 30_000;

// --- Abuse / DoS protection ---------------------------------------------
const MAX_PEERS = Number(process.env.SIGNAL_MAX_PEERS ?? 5000); // hard ceiling
const MAX_CONNS_PER_IP = Number(process.env.SIGNAL_MAX_CONNS_PER_IP ?? 20);
const MSG_RATE_LIMIT = 30; // messages per window per peer
const MSG_RATE_WINDOW_MS = 10_000;
// Comma-separated allowlist of origins. Empty = allow all (dev). Set in prod.
const ALLOWED_ORIGINS = (process.env.SIGNAL_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const connsPerIp = new Map<string, number>(); // ip -> open socket count

function originAllowed(origin: string | null): boolean {
  if (ALLOWED_ORIGINS.length === 0) return true; // not configured => allow (dev)
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

const cooldowns = new Map<string, number>(); // peerId -> until ts

function uuid() {
  return crypto.randomUUID();
}

function send(peer: Peer | undefined, type: string, payload: unknown = {}) {
  if (!peer) return;
  try {
    peer.ws.send(JSON.stringify({ type, payload }));
  } catch {
    /* socket closed */
  }
}

function sanitize(text: string): string {
  return String(text)
    .replace(/<[^>]*>/g, "")
    .slice(0, MAX_MESSAGE_LEN)
    .trim();
}

function partnerOf(peer: Peer): Peer | undefined {
  if (!peer.roomId) return undefined;
  const room = rooms.get(peer.roomId);
  if (!room) return undefined;
  const otherId = room.a === peer.id ? room.b : room.a;
  return peers.get(otherId);
}

function removeFromQueue(id: string) {
  const i = queue.indexOf(id);
  if (i !== -1) queue.splice(i, 1);
}

function hasCommonInterest(a: Peer, b: Peer): boolean {
  if (!a.interests.length || !b.interests.length) return false;
  const set = new Set(a.interests.map((x) => x.toLowerCase()));
  return b.interests.some((x) => set.has(x.toLowerCase()));
}

function tryMatch(peer: Peer) {
  if (peer.roomId) return; // already paired
  if (!queue.includes(peer.id)) return;

  // Candidates: other queued peers with same mode
  const now = Date.now();
  let best: Peer | undefined;
  let bestScore = -1;

  for (const candidateId of queue) {
    if (candidateId === peer.id) continue;
    const cand = peers.get(candidateId);
    if (!cand || cand.roomId) continue;
    if (cand.mode !== peer.mode) continue;

    const common = hasCommonInterest(peer, cand);
    // Score: interest match best; if peer has been waiting > window, accept any.
    let score = 0;
    if (common) score = 2;
    else if (now - peer.queuedAt > INTEREST_MATCH_WINDOW_MS) score = 1;
    else score = peer.interests.length === 0 ? 1 : 0; // no interests => match anyone

    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
    if (score === 2) break; // perfect enough
  }

  if (!best || bestScore <= 0) return;

  // Pair them
  removeFromQueue(peer.id);
  removeFromQueue(best.id);

  const roomId = uuid();
  rooms.set(roomId, { a: peer.id, b: best.id });
  peer.roomId = roomId;
  best.roomId = roomId;

  // First socket (peer) is the initiator
  send(peer, "match_found", { strangerId: best.id, roomId, initiator: true, mode: peer.mode });
  send(best, "match_found", { strangerId: peer.id, roomId, initiator: false, mode: best.mode });
}

function leaveRoom(peer: Peer, reason: string, requeue: boolean) {
  const partner = partnerOf(peer);
  if (peer.roomId) {
    rooms.delete(peer.roomId);
    peer.roomId = null;
  }
  if (partner) {
    partner.roomId = null;
    send(partner, "stranger_disconnected", { reason });
  }
  if (requeue && !cooldowns.has(peer.id)) {
    enqueue(peer);
  }
}

function enqueue(peer: Peer) {
  if (!queue.includes(peer.id)) {
    peer.queuedAt = Date.now();
    queue.push(peer.id);
  }
  send(peer, "queue_position", { position: queue.indexOf(peer.id) + 1, estimatedWait: queue.length * 2 });
  tryMatch(peer);
}

function applySkipCooldown(peer: Peer): number {
  const now = Date.now();
  peer.skipTimestamps = peer.skipTimestamps.filter((t) => now - t < SKIP_WINDOW_MS);
  peer.skipTimestamps.push(now);
  if (peer.skipTimestamps.length > SKIP_LIMIT) {
    const until = now + SKIP_COOLDOWN_MS;
    cooldowns.set(peer.id, until);
    setTimeout(() => cooldowns.delete(peer.id), SKIP_COOLDOWN_MS);
    return Math.ceil(SKIP_COOLDOWN_MS / 1000);
  }
  return 0;
}

const PORT = Number(process.env.SIGNAL_PORT ?? 4201);

const server = Bun.serve<WsData>({
  port: PORT,
  fetch(req, srv) {
    const url = new URL(req.url);
    if (url.pathname === "/signal/health") {
      return new Response(
        JSON.stringify({ status: "ok", online: peers.size, queued: queue.length, rooms: rooms.size }),
        { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } },
      );
    }
    if (url.pathname === "/signal") {
      // Origin allowlist (prevents cross-site socket abuse in prod)
      const origin = req.headers.get("origin");
      if (!originAllowed(origin)) {
        return new Response("forbidden origin", { status: 403 });
      }
      // Per-IP connection cap + global peer ceiling
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        srv.requestIP(req)?.address ||
        "unknown";
      if (peers.size >= MAX_PEERS) {
        return new Response("server at capacity", { status: 503 });
      }
      if ((connsPerIp.get(ip) ?? 0) >= MAX_CONNS_PER_IP) {
        return new Response("too many connections", { status: 429 });
      }
      const id = uuid();
      if (srv.upgrade(req, { data: { id, ip } })) return;
      return new Response("upgrade failed", { status: 400 });
    }
    return new Response("StrangerLink signaling server", { status: 200 });
  },
  websocket: {
    open(ws) {
      const ip = ws.data.ip;
      connsPerIp.set(ip, (connsPerIp.get(ip) ?? 0) + 1);
      const peer: Peer = {
        id: ws.data.id,
        ws,
        ip,
        mode: "text",
        interests: [],
        language: "en",
        roomId: null,
        joinedAt: Date.now(),
        queuedAt: 0,
        skipTimestamps: [],
        msgTimestamps: [],
      };
      peers.set(peer.id, peer);
      send(peer, "connected", { id: peer.id, online: peers.size });
    },
    message(ws, raw) {
      const peer = peers.get(ws.data.id);
      if (!peer) return;
      // Per-peer message rate limit (anti-flood / DoS)
      const now = Date.now();
      peer.msgTimestamps = peer.msgTimestamps.filter((t) => now - t < MSG_RATE_WINDOW_MS);
      peer.msgTimestamps.push(now);
      if (peer.msgTimestamps.length > MSG_RATE_LIMIT) {
        return; // silently drop excess traffic
      }
      // Cap raw frame size before parsing (defensive)
      if (typeof raw === "string" && raw.length > 8192) return;
      let msg: { type: string; payload?: any };
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      const { type, payload = {} } = msg;

      switch (type) {
        case "join_queue": {
          peer.mode = payload.mode === "video" ? "video" : "text";
          peer.interests = Array.isArray(payload.interests)
            ? payload.interests.slice(0, MAX_INTERESTS).map((s: string) => sanitize(s).slice(0, 20)).filter(Boolean)
            : [];
          peer.language = typeof payload.language === "string" ? payload.language : "en";
          if (cooldowns.has(peer.id)) {
            const remaining = Math.ceil((cooldowns.get(peer.id)! - Date.now()) / 1000);
            send(peer, "cooldown", { seconds: Math.max(0, remaining) });
            return;
          }
          enqueue(peer);
          break;
        }
        case "leave_queue": {
          removeFromQueue(peer.id);
          break;
        }
        case "send_message": {
          const text = sanitize(payload.text ?? "");
          if (!text) return;
          const partner = partnerOf(peer);
          send(partner, "stranger_message", { text, timestamp: Date.now() });
          break;
        }
        case "typing_start": {
          send(partnerOf(peer), "stranger_typing");
          break;
        }
        case "typing_stop": {
          send(partnerOf(peer), "stranger_stopped_typing");
          break;
        }
        case "skip_stranger": {
          const cd = applySkipCooldown(peer);
          leaveRoom(peer, "stranger_left", false);
          if (cd > 0) {
            send(peer, "cooldown", { seconds: cd });
          } else {
            enqueue(peer); // re-queue self
          }
          break;
        }
        case "disconnect_chat": {
          leaveRoom(peer, "stranger_left", false);
          break;
        }
        case "webrtc_offer": {
          const partner = partnerOf(peer);
          send(partner, "webrtc_offer", { offer: payload.offer, from: peer.id });
          break;
        }
        case "webrtc_answer": {
          const partner = partnerOf(peer);
          send(partner, "webrtc_answer", { answer: payload.answer, from: peer.id });
          break;
        }
        case "webrtc_ice": {
          const partner = partnerOf(peer);
          send(partner, "webrtc_ice", { candidate: payload.candidate, from: peer.id });
          break;
        }
        case "submit_report": {
          // Forwarded to REST API by client too; log here for moderation hooks.
          console.log("[report]", peer.id, payload.reason);
          break;
        }
        default:
          break;
      }
    },
    close(ws) {
      const ip = ws.data.ip;
      const n = (connsPerIp.get(ip) ?? 1) - 1;
      if (n <= 0) connsPerIp.delete(ip);
      else connsPerIp.set(ip, n);
      const peer = peers.get(ws.data.id);
      if (!peer) return;
      removeFromQueue(peer.id);
      leaveRoom(peer, "stranger_left", false);
      peers.delete(peer.id);
    },
  },
});

console.log(`[signal] StrangerLink signaling server on ws://localhost:${server.port}/signal`);

// Graceful shutdown: tell connected peers before the process exits so clients
// can show a "reconnecting" state instead of a silent drop.
function shutdown(sig: string) {
  console.log(`[signal] received ${sig}, notifying ${peers.size} peers and shutting down`);
  for (const peer of peers.values()) {
    send(peer, "server_shutdown", { reason: "restart" });
    try {
      peer.ws.close();
    } catch {
      /* already closed */
    }
  }
  try {
    server.stop();
  } catch {
    /* noop */
  }
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
