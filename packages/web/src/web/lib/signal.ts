/**
 * Resolve the WebSocket signaling URL.
 *
 * Resolution order:
 *  1. VITE_SIGNAL_URL — explicit full URL (e.g. wss://app.com/signal). Best for prod.
 *  2. Production (HTTPS): assume the signal server is reverse-proxied under the
 *     SAME origin at the `/signal` path (wss://<host>/signal). This is the
 *     recommended prod topology — no extra public port to expose.
 *  3. Dev (HTTP/localhost): the standalone signal server runs on its own port
 *     (VITE_SIGNAL_PORT, default 4201).
 */
export function getSignalUrl(): string {
  const envUrl = import.meta.env.VITE_SIGNAL_URL as string | undefined;
  if (envUrl) return envUrl;

  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";

  // Production: same-origin reverse proxy at /signal (no explicit port).
  if (loc.protocol === "https:") {
    return `${proto}//${loc.host}/signal`;
  }

  // Dev: standalone signal server on its own port.
  const port = (import.meta.env.VITE_SIGNAL_PORT as string | undefined) ?? "4201";
  return `${proto}//${loc.hostname}:${port}/signal`;
}

export type SignalMessage = { type: string; payload?: any };
