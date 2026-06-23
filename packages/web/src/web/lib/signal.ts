/**
 * Resolve the WebSocket signaling URL.
 * In dev the signaling server runs on its own port (SIGNAL_PORT, default 4201).
 * In prod it is reverse-proxied / same host on the signal port via env.
 */
export function getSignalUrl(): string {
  const envUrl = import.meta.env.VITE_SIGNAL_URL as string | undefined;
  if (envUrl) return envUrl;

  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  // Default dev port for the standalone signaling server.
  const port = (import.meta.env.VITE_SIGNAL_PORT as string | undefined) ?? "4201";
  return `${proto}//${loc.hostname}:${port}/signal`;
}

export type SignalMessage = { type: string; payload?: any };
