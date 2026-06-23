import { useCallback, useEffect, useRef, useState } from "react";
import { getSignalUrl, type SignalMessage } from "../lib/signal";

type Handler = (payload: any) => void;

/**
 * Singleton-ish WebSocket connection to the signaling server with auto-reconnect.
 * Returns connection state and emit/on/off helpers.
 */
export function useSignal() {
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef<Map<string, Set<Handler>>>(new Map());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const mounted = useRef(true);

  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [selfId, setSelfId] = useState<string | null>(null);

  const dispatch = useCallback((msg: SignalMessage) => {
    const set = handlers.current.get(msg.type);
    if (set) set.forEach((h) => h(msg.payload));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return;
    const ws = new WebSocket(getSignalUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mounted.current) return;
      retryCount.current = 0; // reset backoff on a successful connect
      setConnected(true);
      setReconnecting(false);
    };
    ws.onmessage = (e) => {
      let msg: SignalMessage;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "connected") setSelfId(msg.payload?.id ?? null);
      dispatch(msg);
    };
    ws.onclose = () => {
      if (!mounted.current) return;
      setConnected(false);
      setReconnecting(true);
      // Exponential backoff with jitter: 1s, 2s, 4s ... capped at 15s.
      const attempt = retryCount.current++;
      const base = Math.min(1000 * 2 ** attempt, 15_000);
      const delay = base + Math.random() * 500;
      reconnectTimer.current = setTimeout(connect, delay);
    };
    ws.onerror = () => {
      ws.close();
    };
  }, [dispatch]);

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback((type: string, payload: unknown = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const on = useCallback((type: string, handler: Handler) => {
    if (!handlers.current.has(type)) handlers.current.set(type, new Set());
    handlers.current.get(type)!.add(handler);
    return () => handlers.current.get(type)?.delete(handler);
  }, []);

  const off = useCallback((type: string, handler: Handler) => {
    handlers.current.get(type)?.delete(handler);
  }, []);

  return { connected, reconnecting, selfId, emit, on, off };
}

export type SignalApi = ReturnType<typeof useSignal>;
