import { useState, useCallback, useRef, useEffect } from "react";
import { subscribeEvents, parseSSELines } from "../lib/api";
import type { ServerEvent, Message, MessagePart } from "../constants/types";

export interface SSEState {
  connected: boolean;
  streaming: boolean;
  error: string | null;
  events: ServerEvent[];
}

export function useSSE(sessionId?: string) {
  const [state, setState] = useState<SSEState>({
    connected: false,
    streaming: false,
    error: null,
    events: [],
  });

  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef("");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    setState((s) => ({ ...s, error: null, connected: false, streaming: true }));

    try {
      const response = await subscribeEvents(sessionId);
      if (!mountedRef.current) return;
      abortRef.current = new AbortController();
      retryCountRef.current = 0;
      setState((s) => ({ ...s, connected: true, streaming: true, error: null }));

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || !mountedRef.current) break;

        bufferRef.current += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSELines(bufferRef.current);
        bufferRef.current = remaining;

        if (events.length > 0) {
          setState((s) => ({
            ...s,
            events: [...s.events, ...events],
          }));
        }
      }

      if (mountedRef.current) {
        setState((s) => ({ ...s, connected: false, streaming: false }));
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.name === "AbortError") return;

      const msg = err instanceof Error ? err.message : "Connection failed";
      setState((s) => ({
        ...s,
        connected: false,
        streaming: false,
        error: msg,
      }));
    }
  }, [sessionId]);

  const disconnect = useCallback(() => {
    mountedRef.current = false;
    abortRef.current?.abort();
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    setState({ connected: false, streaming: false, error: null, events: [] });
  }, []);

  const clearEvents = useCallback(() => {
    setState((s) => ({ ...s, events: [] }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    clearEvents,
  };
}

// ── Derived helpers ──

/** Extract the latest assistant message from events */
export function getLatestAssistantMessage(events: ServerEvent[]): Message | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.type === "message.created" || ev.type === "message.updated") {
      const msg = ev.properties as Message;
      if (msg.role === "assistant") return msg;
    }
  }
  return null;
}

/** Extract all messages from events in order */
export function getMessagesFromEvents(events: ServerEvent[]): Message[] {
  const map = new Map<string, Message>();

  for (const ev of events) {
    if (ev.type === "message.created") {
      const msg = ev.properties as Message;
      map.set(msg.id, msg);
    } else if (ev.type === "message.updated") {
      const partial = ev.properties as Partial<Message> & { id: string };
      const existing = map.get(partial.id);
      if (existing) {
        map.set(partial.id, { ...existing, ...partial });
      }
    } else if (ev.type === "message.part.updated") {
      const { messageID, part } = ev.properties as {
        messageID: string;
        part: MessagePart;
        sessionID: string;
      };
      const existing = map.get(messageID);
      if (existing) {
        const partIdx = existing.parts.findIndex(
          (p) => JSON.stringify(p) === JSON.stringify(part)
        );
        const newParts = [...existing.parts];
        if (partIdx >= 0) {
          newParts[partIdx] = part;
        } else {
          newParts.push(part);
        }
        map.set(messageID, { ...existing, parts: newParts });
      }
    }
  }

  return Array.from(map.values());
}
